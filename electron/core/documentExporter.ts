import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

export interface MeetingExportData {
  title: string;
  date: Date;
  participants: string[];
  rawTranscript: string;
  cleanedText: string;
  summary: string;
}

const sanitizeFilename = (name: string) =>
  name.replace(/[/\\?%*:|"<>]/g, '-').trim();

/**
 * Word (.docx) 파일로 내보내기
 */
export const exportToWord = async (
  meeting: MeetingExportData,
  outputDir?: string,
): Promise<string> => {
  const dateStr = meeting.date.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const content = meeting.cleanedText || meeting.rawTranscript || '(내용 없음)';
  const summary = meeting.summary || '(요약 없음)';

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: meeting.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `날짜: ${dateStr}`, bold: true, size: 24 }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `참석자: ${meeting.participants.length > 0 ? meeting.participants.join(', ') : '미기재'}`,
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({ text: '' }),

          new Paragraph({
            text: '■ 요약',
            heading: HeadingLevel.HEADING_1,
            border: { bottom: { style: BorderStyle.SINGLE, size: 1 } },
          }),
          new Paragraph({ text: '' }),
          ...summary.split('\n').map(
            (line) => new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }),
          ),
          new Paragraph({ text: '' }),

          new Paragraph({
            text: '■ 회의 내용',
            heading: HeadingLevel.HEADING_1,
            border: { bottom: { style: BorderStyle.SINGLE, size: 1 } },
          }),
          new Paragraph({ text: '' }),
          ...content.split('\n').map(
            (line) => new Paragraph({ children: [new TextRun({ text: line, size: 22 })] }),
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const dir = outputDir ?? app.getPath('downloads');
  await fs.mkdir(dir, { recursive: true });

  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilename(meeting.title)}_${dateTag}.docx`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

/**
 * Markdown 파일로 내보내기 (Obsidian 호환)
 */
export const exportToMarkdown = async (
  meeting: MeetingExportData,
  vaultPath: string,
): Promise<string> => {
  const dateStr = meeting.date.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const isoDate = meeting.date.toISOString().slice(0, 10);
  const content = meeting.cleanedText || meeting.rawTranscript || '(내용 없음)';
  const summary = meeting.summary || '(요약 없음)';
  const participantList =
    meeting.participants.length > 0
      ? meeting.participants.map((p) => `- ${p}`).join('\n')
      : '- (미기재)';

  const md = [
    '---',
    `title: "${meeting.title}"`,
    `date: ${isoDate}`,
    `tags: [회의록]`,
    '---',
    '',
    `# ${meeting.title}`,
    '',
    `> **날짜:** ${dateStr}`,
    '',
    '## 참석자',
    '',
    participantList,
    '',
    '## 요약',
    '',
    summary,
    '',
    '## 회의 내용',
    '',
    content,
    '',
    '---',
    `*자동 생성: ${new Date().toLocaleString('ko-KR')}*`,
  ].join('\n');

  await fs.mkdir(vaultPath, { recursive: true });

  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilename(meeting.title)}_${dateTag}.md`;
  const filePath = path.join(vaultPath, filename);
  await fs.writeFile(filePath, md, 'utf-8');
  return filePath;
};
