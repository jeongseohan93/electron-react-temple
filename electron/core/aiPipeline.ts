import fs from 'node:fs/promises';

export interface AIPipelineResult {
  rawTranscript: string;
  cleanedText: string;
  summary: string;
}

/**
 * STT: 음성 파일 → 텍스트 변환
 * TODO: OpenAI Whisper API 또는 다른 STT 서비스 연동
 */
export const transcribeAudio = async (audioPath: string): Promise<string> => {
  await fs.access(audioPath);
  // Whisper API 연동 예시 (추후 구현):
  // const formData = new FormData();
  // formData.append('file', fs.createReadStream(audioPath));
  // formData.append('model', 'whisper-1');
  // const res = await openai.audio.transcriptions.create(formData);
  // return res.text;
  return '';
};

/**
 * 텍스트 문맥 교정: 구어체 → 문어체, 문법 교정
 * TODO: Claude API 연동 (anthropic sdk 설치됨)
 */
export const cleanTranscript = async (rawText: string, apiKey?: string): Promise<string> => {
  if (!rawText.trim()) return '';
  if (!apiKey) return rawText;

  // Claude API 연동 예시 (추후 구현):
  // const anthropic = new Anthropic({ apiKey });
  // const message = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-6',
  //   max_tokens: 4096,
  //   messages: [{
  //     role: 'user',
  //     content: `다음 회의 녹취록을 자연스러운 한국어 문어체로 교정하고 발언자 구분 없이 내용만 정리해주세요:\n\n${rawText}`
  //   }]
  // });
  // return message.content[0].type === 'text' ? message.content[0].text : rawText;
  return rawText;
};

/**
 * 회의 내용 요약
 * TODO: Claude API 연동
 */
export const summarizeText = async (cleanedText: string, apiKey?: string): Promise<string> => {
  if (!cleanedText.trim()) return '';
  if (!apiKey) return '';

  // Claude API 연동 예시 (추후 구현):
  // const anthropic = new Anthropic({ apiKey });
  // const message = await anthropic.messages.create({
  //   model: 'claude-sonnet-4-6',
  //   max_tokens: 1024,
  //   messages: [{
  //     role: 'user',
  //     content: `다음 회의 내용을 핵심 의결 사항, 주요 논의 사항, 액션 아이템으로 구분하여 요약해주세요:\n\n${cleanedText}`
  //   }]
  // });
  // return message.content[0].type === 'text' ? message.content[0].text : '';
  return '';
};

/**
 * 전체 파이프라인 실행: 음성 → STT → 문맥교정 → 요약
 */
export const runFullPipeline = async (
  audioPath: string,
  apiKey?: string,
): Promise<AIPipelineResult> => {
  const rawTranscript = await transcribeAudio(audioPath);
  const cleanedText = await cleanTranscript(rawTranscript, apiKey);
  const summary = await summarizeText(cleanedText, apiKey);
  return { rawTranscript, cleanedText, summary };
};
