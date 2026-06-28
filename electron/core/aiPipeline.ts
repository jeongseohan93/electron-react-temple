import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Ollama } from 'ollama';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { nodewhisper } from 'nodejs-whisper';

// ffmpeg-static 경로 설정 (Windows/Mac 모두 자동 해결)
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

export interface AIPipelineResult {
  rawTranscript: string;
  cleanedText: string;
  summary: string;
}

export interface LocalAISettings {
  ollamaHost: string;
  ollamaModel: string;
  whisperModel: 'tiny' | 'base' | 'small' | 'medium' | 'large';
}

export const DEFAULT_AI_SETTINGS: LocalAISettings = {
  ollamaHost: 'http://127.0.0.1:11434',
  ollamaModel: 'llama3.2',
  whisperModel: 'base',
};

/**
 * WebM(브라우저 녹음) → WAV 16kHz mono 변환
 * Whisper는 16kHz mono WAV를 요구함
 */
const convertToWav = (inputPath: string): Promise<string> => {
  const outputPath = path.join(os.tmpdir(), `whisper_${Date.now()}.wav`);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err: Error) =>
        reject(new Error(`오디오 변환 실패: ${err.message}`)),
      )
      .run();
  });
};

/**
 * STT: 로컬 Whisper (nodejs-whisper, whisper.cpp 래퍼)
 * 첫 실행 시 모델 파일 자동 다운로드 (~150MB for base)
 */
export const transcribeAudio = async (
  audioPath: string,
  settings: LocalAISettings = DEFAULT_AI_SETTINGS,
): Promise<string> => {
  if (!audioPath) return '';
  await fs.access(audioPath);

  const wavPath = await convertToWav(audioPath);
  try {
    const result = await nodewhisper(wavPath, {
      modelName: settings.whisperModel,
      autoDownloadModelName: settings.whisperModel,
      whisperOptions: {
        outputInText: true,
        language: 'ko',
      },
    });
    return (typeof result === 'string' ? result : '').trim();
  } finally {
    await fs.unlink(wavPath).catch(() => {});
  }
};

/**
 * 문맥 교정: 구어체 → 문어체 (로컬 Ollama)
 */
export const cleanTranscript = async (
  rawText: string,
  settings: LocalAISettings = DEFAULT_AI_SETTINGS,
): Promise<string> => {
  if (!rawText.trim()) return rawText;
  const ollama = new Ollama({ host: settings.ollamaHost });
  const res = await ollama.chat({
    model: settings.ollamaModel,
    messages: [
      {
        role: 'system',
        content:
          '당신은 한국어 회의록 교정 전문가입니다. 입력된 녹취록의 원문 의미를 그대로 유지하면서, 구어체 표현을 자연스러운 문어체로 교정하고 불필요한 반복을 제거합니다.',
      },
      {
        role: 'user',
        content: `다음 회의 녹취록을 교정해주세요:\n\n${rawText}`,
      },
    ],
  });
  return res.message.content.trim();
};

/**
 * 요약: 핵심 의결 사항 / 논의 사항 / 액션 아이템 (로컬 Ollama)
 */
export const summarizeText = async (
  text: string,
  settings: LocalAISettings = DEFAULT_AI_SETTINGS,
): Promise<string> => {
  if (!text.trim()) return '';
  const ollama = new Ollama({ host: settings.ollamaHost });
  const res = await ollama.chat({
    model: settings.ollamaModel,
    messages: [
      {
        role: 'system',
        content:
          '당신은 한국어 회의록 요약 전문가입니다. 회의 내용을 지정된 형식으로 간결하게 요약합니다.',
      },
      {
        role: 'user',
        content: `다음 회의 내용을 아래 형식으로 요약해주세요:\n\n## 핵심 의결 사항\n- ...\n\n## 주요 논의 사항\n- ...\n\n## 액션 아이템\n- ...\n\n---\n회의 내용:\n${text}`,
      },
    ],
  });
  return res.message.content.trim();
};

/**
 * 전체 파이프라인: 녹음 파일 → STT → 교정 → 요약
 */
export const runFullPipeline = async (
  audioPath: string,
  settings: LocalAISettings = DEFAULT_AI_SETTINGS,
): Promise<AIPipelineResult> => {
  const rawTranscript = await transcribeAudio(audioPath, settings);
  const cleanedText = await cleanTranscript(rawTranscript, settings);
  const summary = await summarizeText(cleanedText, settings);
  return { rawTranscript, cleanedText, summary };
};
