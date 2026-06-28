import { ipcMain, BrowserWindow } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { prisma } from '../core/database';
import {
  connectBot,
  disconnectBot,
  getStatus,
  getGuilds,
  getVoiceChannels,
  startRecording,
  stopRecording,
  onStatusChange,
} from '../core/discordBot';

const AUDIO_DIR = path.join(app.getPath('userData'), 'meeting-audio');

const ensureAudioDir = async () => {
  await fs.mkdir(AUDIO_DIR, { recursive: true });
};

export const registerDiscordBotHandlers = (win: BrowserWindow): void => {

  // Status change pushes to renderer
  onStatusChange((status) => {
    win.webContents.send('discord:status-change', status);
  });

  // ── 봇 연결 ──────────────────────────────────────────────────────────
  ipcMain.handle('discord:connect', async (_, token: string) => {
    // Persist token in settings
    await prisma.settings.upsert({
      where: { key: 'discord_bot_token' },
      update: { value: token },
      create: { key: 'discord_bot_token', value: token },
    });
    return connectBot(token);
  });

  // ── 봇 연결 해제 ──────────────────────────────────────────────────────
  ipcMain.handle('discord:disconnect', async () => {
    return disconnectBot();
  });

  // ── 저장된 토큰으로 자동 연결 ────────────────────────────────────────
  ipcMain.handle('discord:auto-connect', async () => {
    const setting = await prisma.settings.findUnique({ where: { key: 'discord_bot_token' } });
    if (!setting?.value) return { success: false, message: '저장된 토큰 없음' };
    return connectBot(setting.value);
  });

  // ── 현재 상태 조회 ────────────────────────────────────────────────────
  ipcMain.handle('discord:get-status', async () => {
    const status = getStatus();
    const setting = await prisma.settings.findUnique({ where: { key: 'discord_bot_token' } });
    return { ...status, hasToken: !!setting?.value };
  });

  // ── 서버 목록 조회 ────────────────────────────────────────────────────
  ipcMain.handle('discord:get-guilds', () => {
    return getGuilds();
  });

  // ── 보이스 채널 목록 조회 ────────────────────────────────────────────
  ipcMain.handle('discord:get-channels', async (_, { guildId }: { guildId: string }) => {
    return getVoiceChannels(guildId);
  });

  // ── 녹음 시작 ─────────────────────────────────────────────────────────
  ipcMain.handle('discord:start-recording', async (_, {
    guildId,
    channelId,
    meetingId,
  }: { guildId: string; channelId: string; meetingId: string }) => {
    const result = await startRecording(guildId, channelId, meetingId);
    if (result.success) {
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'recorded' },
      }).catch(() => {});
    }
    return result;
  });

  // ── 녹음 중지 → 오디오 파일 저장 ────────────────────────────────────
  ipcMain.handle('discord:stop-recording', async (_, { meetingId }: { meetingId: string }) => {
    const result = await stopRecording();
    if (!result.success || !result.audioPath) return result;

    try {
      await ensureAudioDir();
      const destFilename = `meeting_${meetingId}_discord_${Date.now()}.wav`;
      const destPath = path.join(AUDIO_DIR, destFilename);
      await fs.copyFile(result.audioPath, destPath);
      await fs.unlink(result.audioPath).catch(() => {});

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { audioPath: destPath, status: 'recorded' },
      });

      return { success: true, audioPath: destPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }
  });
};
