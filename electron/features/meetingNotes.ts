import { ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { app } from 'electron';
import { prisma } from '../core/database';
import {
  runFullPipeline, cleanTranscript, summarizeText,
  DEFAULT_AI_SETTINGS, LocalAISettings,
} from '../core/aiPipeline';
import { exportToMarkdown } from '../core/documentExporter';

const AUDIO_DIR = path.join(app.getPath('userData'), 'meeting-audio');

const ensureAudioDir = async () => {
  await fs.mkdir(AUDIO_DIR, { recursive: true });
};

/** DB에서 로컬 AI 설정 읽기 */
const getAISettings = async (): Promise<LocalAISettings> => {
  const [host, model, whisper] = await Promise.all([
    prisma.settings.findUnique({ where: { key: 'ollama_host' } }),
    prisma.settings.findUnique({ where: { key: 'ollama_model' } }),
    prisma.settings.findUnique({ where: { key: 'whisper_model' } }),
  ]);
  return {
    ollamaHost: host?.value ?? DEFAULT_AI_SETTINGS.ollamaHost,
    ollamaModel: model?.value ?? DEFAULT_AI_SETTINGS.ollamaModel,
    whisperModel: (whisper?.value ?? DEFAULT_AI_SETTINGS.whisperModel) as LocalAISettings['whisperModel'],
  };
};

export const registerMeetingNotesHandlers = (): void => {

  // ── 회의 생성 ───────────────────────────────────────────────────────
  ipcMain.handle('meeting:create', async (_, { title, participants }: { title: string; participants: string[] }) => {
    try {
      const meeting = await prisma.meeting.create({
        data: {
          title,
          participants: JSON.stringify(participants),
          status: 'draft',
        },
      });
      return { success: true, data: { ...meeting, participants: JSON.parse(meeting.participants) } };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── 전체 목록 ─────────────────────────────────────────────────────────
  ipcMain.handle('meeting:list', async () => {
    try {
      const meetings = await prisma.meeting.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return {
        success: true,
        data: meetings.map((m) => ({ ...m, participants: JSON.parse(m.participants) })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── 단일 조회 ─────────────────────────────────────────────────────────
  ipcMain.handle('meeting:get', async (_, { id }: { id: string }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (!meeting) return { success: false, message: '회의를 찾을 수 없습니다.' };
      return { success: true, data: { ...meeting, participants: JSON.parse(meeting.participants) } };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── 회의 수정 ─────────────────────────────────────────────────────────
  ipcMain.handle('meeting:update', async (_, { id, data }: { id: string; data: Record<string, unknown> }) => {
    try {
      const updatePayload: Record<string, unknown> = { ...data };
      if (Array.isArray(updatePayload.participants)) {
        updatePayload.participants = JSON.stringify(updatePayload.participants);
      }
      const updated = await prisma.meeting.update({ where: { id }, data: updatePayload });
      return { success: true, data: { ...updated, participants: JSON.parse(updated.participants) } };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── 회의 삭제 ─────────────────────────────────────────────────────────
  ipcMain.handle('meeting:delete', async (_, { id }: { id: string }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (meeting?.audioPath) {
        await fs.unlink(meeting.audioPath).catch(() => {});
      }
      await prisma.meeting.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── 오디오 저장 ───────────────────────────────────────────────────────
  ipcMain.handle('meeting:save-audio', async (_, { id, audioBuffer }: { id: string; audioBuffer: ArrayBuffer }) => {
    try {
      await ensureAudioDir();
      const filename = `meeting_${id}_${Date.now()}.webm`;
      const audioPath = path.join(AUDIO_DIR, filename);
      await fs.writeFile(audioPath, Buffer.from(audioBuffer));
      await prisma.meeting.update({ where: { id }, data: { audioPath, status: 'recorded' } });
      return { success: true, audioPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── AI 전체 파이프라인 실행 ───────────────────────────────────────────
  ipcMain.handle('meeting:run-ai-pipeline', async (_event, { id }: { id: string }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (!meeting) return { success: false, message: '회의를 찾을 수 없습니다.' };

      await prisma.meeting.update({ where: { id }, data: { status: 'processing' } });

      const aiSettings = await getAISettings();
      const result = await runFullPipeline(meeting.audioPath, aiSettings);

      const updated = await prisma.meeting.update({
        where: { id },
        data: {
          rawTranscript: result.rawTranscript,
          cleanedText: result.cleanedText,
          summary: result.summary,
          status: 'done',
        },
      });
      return { success: true, data: { ...updated, participants: JSON.parse(updated.participants) } };
    } catch (error) {
      await prisma.meeting.update({ where: { id }, data: { status: 'error' } }).catch(() => {});
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── 텍스트만 AI 교정 ─────────────────────────────────────────────────
  ipcMain.handle('meeting:clean-text', async (_, { id }: { id: string }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (!meeting) return { success: false, message: '회의를 찾을 수 없습니다.' };

      const aiSettings = await getAISettings();
      const cleanedText = await cleanTranscript(meeting.rawTranscript, aiSettings);

      const updated = await prisma.meeting.update({ where: { id }, data: { cleanedText } });
      return { success: true, data: { ...updated, participants: JSON.parse(updated.participants) } };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── 텍스트만 AI 요약 ─────────────────────────────────────────────────
  ipcMain.handle('meeting:summarize', async (_, { id }: { id: string }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (!meeting) return { success: false, message: '회의를 찾을 수 없습니다.' };

      const aiSettings = await getAISettings();
      const text = meeting.cleanedText || meeting.rawTranscript;
      const summary = await summarizeText(text, aiSettings);

      const updated = await prisma.meeting.update({ where: { id }, data: { summary } });
      return { success: true, data: { ...updated, participants: JSON.parse(updated.participants) } };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── Word 내보내기 ─────────────────────────────────────────────────────
  ipcMain.handle('meeting:export-word', async (_, { id }: { id: string }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (!meeting) return { success: false, message: '회의를 찾을 수 없습니다.' };

      const { filePath: dirPath } = await dialog.showSaveDialog({
        title: 'Word 파일 저장',
        defaultPath: `${meeting.title}.docx`,
        filters: [{ name: 'Word 문서', extensions: ['docx'] }],
      });

      if (!dirPath) return { success: false, message: '저장 취소됨' };

      const exportData = {
        title: meeting.title,
        date: new Date(meeting.date),
        participants: JSON.parse(meeting.participants) as string[],
        rawTranscript: meeting.rawTranscript,
        cleanedText: meeting.cleanedText,
        summary: meeting.summary,
      };

      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');
      const dateStr = exportData.date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
      const content = exportData.cleanedText || exportData.rawTranscript || '(내용 없음)';
      const summary = exportData.summary || '(요약 없음)';

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: exportData.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [new TextRun({ text: `날짜: ${dateStr}`, bold: true, size: 24 })] }),
            new Paragraph({ children: [new TextRun({ text: `참석자: ${exportData.participants.join(', ') || '미기재'}`, bold: true, size: 24 })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '■ 요약', heading: HeadingLevel.HEADING_1, border: { bottom: { style: BorderStyle.SINGLE, size: 1 } } }),
            new Paragraph({ text: '' }),
            ...summary.split('\n').map((line: string) => new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })),
            new Paragraph({ text: '' }),
            new Paragraph({ text: '■ 회의 내용', heading: HeadingLevel.HEADING_1, border: { bottom: { style: BorderStyle.SINGLE, size: 1 } } }),
            new Paragraph({ text: '' }),
            ...content.split('\n').map((line: string) => new Paragraph({ children: [new TextRun({ text: line, size: 22 })] })),
          ],
        }],
      });

      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(dirPath, buffer);
      await shell.showItemInFolder(dirPath);
      return { success: true, filePath: dirPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── Markdown (Obsidian) 내보내기 ──────────────────────────────────────
  ipcMain.handle('meeting:export-markdown', async (_, { id }: { id: string }) => {
    try {
      const meeting = await prisma.meeting.findUnique({ where: { id } });
      if (!meeting) return { success: false, message: '회의를 찾을 수 없습니다.' };

      // 저장된 Obsidian 볼트 경로 확인
      const vaultSetting = await prisma.settings.findUnique({ where: { key: 'obsidian_vault_path' } });
      let vaultPath = vaultSetting?.value;

      if (!vaultPath) {
        const { filePaths } = await dialog.showOpenDialog({
          title: 'Obsidian 볼트 폴더 선택',
          properties: ['openDirectory'],
        });
        if (!filePaths[0]) return { success: false, message: '폴더 선택 취소됨' };
        vaultPath = filePaths[0];
        await prisma.settings.upsert({
          where: { key: 'obsidian_vault_path' },
          update: { value: vaultPath },
          create: { key: 'obsidian_vault_path', value: vaultPath },
        });
      }

      const exportData = {
        title: meeting.title,
        date: new Date(meeting.date),
        participants: JSON.parse(meeting.participants) as string[],
        rawTranscript: meeting.rawTranscript,
        cleanedText: meeting.cleanedText,
        summary: meeting.summary,
      };

      const filePath = await exportToMarkdown(exportData, vaultPath);
      await shell.showItemInFolder(filePath);
      return { success: true, filePath };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });

  // ── Obsidian 볼트 경로 관리 ───────────────────────────────────────────
  ipcMain.handle('meeting:get-obsidian-path', async () => {
    const setting = await prisma.settings.findUnique({ where: { key: 'obsidian_vault_path' } });
    return { success: true, path: setting?.value ?? '' };
  });

  ipcMain.handle('meeting:set-obsidian-path', async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Obsidian 볼트 폴더 선택',
      properties: ['openDirectory'],
    });
    if (!filePaths[0]) return { success: false, message: '취소됨' };
    await prisma.settings.upsert({
      where: { key: 'obsidian_vault_path' },
      update: { value: filePaths[0] },
      create: { key: 'obsidian_vault_path', value: filePaths[0] },
    });
    return { success: true, path: filePaths[0] };
  });

  // ── 로컬 AI 설정 조회/수정 ────────────────────────────────────────────
  ipcMain.handle('ai:get-settings', async () => {
    const settings = await getAISettings();
    return { success: true, data: settings };
  });

  ipcMain.handle('ai:update-settings', async (_, patch: Partial<LocalAISettings>) => {
    const entries: [string, string][] = [];
    if (patch.ollamaHost)  entries.push(['ollama_host',    patch.ollamaHost]);
    if (patch.ollamaModel) entries.push(['ollama_model',   patch.ollamaModel]);
    if (patch.whisperModel)entries.push(['whisper_model',  patch.whisperModel]);

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.settings.upsert({ where: { key }, update: { value }, create: { key, value } }),
      ),
    );
    return { success: true, data: await getAISettings() };
  });

  // ── Ollama 연결 상태 확인 ─────────────────────────────────────────────
  ipcMain.handle('ai:check-ollama', async () => {
    try {
      const settings = await getAISettings();
      const { Ollama } = await import('ollama');
      const ollama = new Ollama({ host: settings.ollamaHost });
      const list = await ollama.list();
      return {
        success: true,
        models: list.models.map((m: { name: string }) => m.name),
        currentModel: settings.ollamaModel,
      };
    } catch {
      return { success: false, message: 'Ollama에 연결할 수 없습니다. Ollama가 실행 중인지 확인하세요.' };
    }
  });
};
