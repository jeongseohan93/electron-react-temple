import { Client, GatewayIntentBits, ChannelType, Guild, VoiceChannel } from 'discord.js';
import {
  joinVoiceChannel,
  getVoiceConnection,
  EndBehaviorType,
  VoiceConnectionStatus,
  VoiceConnection,
  entersState,
} from '@discordjs/voice';
import { opus as Opus } from 'prism-media';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'node:path';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

export interface DiscordGuild {
  id: string;
  name: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  memberCount: number;
}

export interface DiscordBotStatus {
  connected: boolean;
  botName?: string;
  recording: boolean;
  channelName?: string;
  guildName?: string;
}

interface UserRecordingStream {
  opusStream: ReturnType<VoiceConnection['receiver']['subscribe']>;
  pcmFile: string;
  writeStream: fs.WriteStream;
}

interface RecordingState {
  connection: VoiceConnection;
  guildId: string;
  channelId: string;
  meetingId: string;
  tempDir: string;
  userStreams: Map<string, UserRecordingStream>;
}

let botClient: Client | null = null;
let recordingState: RecordingState | null = null;
let statusChangeCallback: ((status: DiscordBotStatus) => void) | null = null;

const emitStatus = () => {
  if (!statusChangeCallback) return;
  const status = getStatus();
  statusChangeCallback(status);
};

export const onStatusChange = (cb: (status: DiscordBotStatus) => void) => {
  statusChangeCallback = cb;
};

export const getStatus = (): DiscordBotStatus => {
  if (!botClient || !botClient.isReady()) {
    return { connected: false, recording: false };
  }
  const rec = recordingState;
  if (!rec) {
    return { connected: true, botName: botClient.user?.username, recording: false };
  }
  const guild = botClient.guilds.cache.get(rec.guildId);
  const channel = guild?.channels.cache.get(rec.channelId);
  return {
    connected: true,
    botName: botClient.user?.username,
    recording: true,
    channelName: channel?.name,
    guildName: guild?.name,
  };
};

export const connectBot = async (token: string): Promise<{ success: boolean; botName?: string; message?: string }> => {
  try {
    if (botClient?.isReady()) {
      return { success: true, botName: botClient.user?.username };
    }

    botClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
      ],
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('로그인 타임아웃 (15초)')), 15000);
      botClient!.once('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      botClient!.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      botClient!.login(token).catch(reject);
    });

    emitStatus();
    return { success: true, botName: botClient.user?.username };
  } catch (error) {
    botClient = null;
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message };
  }
};

export const disconnectBot = async (): Promise<{ success: boolean }> => {
  try {
    if (recordingState) {
      await stopRecording().catch(() => {});
    }
    botClient?.destroy();
    botClient = null;
    emitStatus();
    return { success: true };
  } catch {
    return { success: true };
  }
};

export const getGuilds = (): { success: boolean; guilds?: DiscordGuild[]; message?: string } => {
  if (!botClient?.isReady()) return { success: false, message: '봇이 연결되지 않았습니다.' };
  const guilds: DiscordGuild[] = botClient.guilds.cache.map((g: Guild) => ({ id: g.id, name: g.name }));
  return { success: true, guilds };
};

export const getVoiceChannels = async (guildId: string): Promise<{ success: boolean; channels?: DiscordChannel[]; message?: string }> => {
  if (!botClient?.isReady()) return { success: false, message: '봇이 연결되지 않았습니다.' };
  try {
    const guild = botClient.guilds.cache.get(guildId) ?? await botClient.guilds.fetch(guildId);
    await guild.channels.fetch();
    const channels: DiscordChannel[] = guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildVoice)
      .map((ch) => {
        const vc = ch as VoiceChannel;
        return { id: vc.id, name: vc.name, memberCount: vc.members.size };
      });
    return { success: true, channels };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message };
  }
};

const convertPcmToWav = (pcmPath: string): Promise<string> => {
  const wavPath = pcmPath.replace('.pcm', '.wav');
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(pcmPath)
      .inputOptions(['-f s16le', '-ar 48000', '-ac 2'])
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .output(wavPath)
      .on('end', () => resolve(wavPath))
      .on('error', (err: Error) => reject(new Error(`PCM 변환 실패: ${err.message}`)))
      .run();
  });
};

const mergeWavFiles = (wavFiles: string[], outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg();
    wavFiles.forEach((f) => { cmd = cmd.input(f); });

    if (wavFiles.length === 1) {
      cmd
        .audioFrequency(16000)
        .audioChannels(1)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(new Error(`WAV 병합 실패: ${err.message}`)))
        .run();
    } else {
      const amixFilter = `amix=inputs=${wavFiles.length}:duration=longest:dropout_transition=2`;
      cmd
        .complexFilter([{ filter: 'amix', options: { inputs: wavFiles.length, duration: 'longest', dropout_transition: 2 }, outputs: 'mixed' }])
        .map('[mixed]')
        .audioFrequency(16000)
        .audioChannels(1)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(new Error(`WAV 병합 실패: ${err.message}`)))
        .run();
    }
  });
};

export const startRecording = async (
  guildId: string,
  channelId: string,
  meetingId: string,
): Promise<{ success: boolean; message?: string }> => {
  if (!botClient?.isReady()) return { success: false, message: '봇이 연결되지 않았습니다.' };
  if (recordingState) return { success: false, message: '이미 녹음 중입니다.' };

  try {
    const guild = botClient.guilds.cache.get(guildId) ?? await botClient.guilds.fetch(guildId);
    const channel = guild.channels.cache.get(channelId) as VoiceChannel;
    if (!channel) return { success: false, message: '채널을 찾을 수 없습니다.' };

    const connection = joinVoiceChannel({
      channelId,
      guildId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: true,
    });

    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

    const tempDir = path.join(os.tmpdir(), `discord_rec_${meetingId}_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const userStreams = new Map<string, UserRecordingStream>();

    connection.receiver.speaking.on('start', (userId: string) => {
      if (userStreams.has(userId)) return;

      const opusStream = connection.receiver.subscribe(userId, {
        end: { behavior: EndBehaviorType.Manual },
      });
      const decoder = new Opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
      const pcmFile = path.join(tempDir, `${userId}.pcm`);
      const writeStream = fs.createWriteStream(pcmFile);
      opusStream.pipe(decoder).pipe(writeStream);
      userStreams.set(userId, { opusStream, pcmFile, writeStream });
    });

    recordingState = { connection, guildId, channelId, meetingId, tempDir, userStreams };
    emitStatus();
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message };
  }
};

export const stopRecording = async (): Promise<{ success: boolean; audioPath?: string; message?: string }> => {
  if (!recordingState) return { success: false, message: '녹음 중이 아닙니다.' };

  const { connection, tempDir, userStreams, meetingId } = recordingState;
  recordingState = null;

  try {
    // Destroy all user streams
    const closePromises = Array.from(userStreams.values()).map(({ opusStream, writeStream }) =>
      new Promise<void>((resolve) => {
        writeStream.on('finish', resolve);
        opusStream.destroy();
        writeStream.end();
      }),
    );
    await Promise.all(closePromises);

    // Leave voice channel
    connection.destroy();

    const pcmFiles = Array.from(userStreams.values()).map((s) => s.pcmFile).filter((f) => {
      try { return fs.statSync(f).size > 0; } catch { return false; }
    });

    if (pcmFiles.length === 0) {
      emitStatus();
      return { success: false, message: '녹음된 오디오 데이터가 없습니다.' };
    }

    // Convert each PCM to WAV (16kHz mono)
    const wavFiles = await Promise.all(pcmFiles.map(convertPcmToWav));

    const outputPath = path.join(os.tmpdir(), `discord_meeting_${meetingId}_${Date.now()}.wav`);
    await mergeWavFiles(wavFiles, outputPath);

    // Cleanup temp files
    await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    await Promise.all(wavFiles.map((w) => fsPromises.unlink(w).catch(() => {})));

    emitStatus();
    return { success: true, audioPath: outputPath };
  } catch (error) {
    emitStatus();
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return { success: false, message };
  }
};

// Cleanup on process exit
process.on('exit', () => {
  botClient?.destroy();
});
