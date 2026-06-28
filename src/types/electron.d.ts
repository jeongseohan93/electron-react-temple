import { LostArkEvent, LostarkNotice, CalendarResponse } from "../features/dashboard/pages/mainPage/types/Lostark.types";

// ── 회의록 공통 타입 ────────────────────────────────────────────────────
export interface Meeting {
    id: string;
    title: string;
    participants: string[];
    rawTranscript: string;
    cleanedText: string;
    summary: string;
    status: 'draft' | 'recorded' | 'processing' | 'done' | 'error';
    audioPath: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}

export interface MeetingIpcResult<T = void> {
    success: boolean;
    data?: T;
    message?: string;
}

/**
 * @interface IElectronAPI
 * @description Electron의 `contextBridge`를 통해 Renderer Process에 노출되는 API의 전체 타입을 정의
 */
export interface IElectronAPI {

    // 창 관리 핸들러
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    openExternalLink: (url: string) => Promise<{success: boolean}>;
    resizeWindow: (width: number, height: number) => void;

    // 설정 창 관련 핸들러
    openSettingWindow: () => Promise<void>;
    closeSettingWindow: () => void;
    deleteApiKey: () => Promise<{ success: boolean; message?: string }>;
    onApiKeyDeleted: (callback: () => void) => void;
    removeApiKeyDeletedListener: () => void;

    // API 키 관리 핸들러
    saveApiKey: (apiKey: string) => Promise<{ success: boolean }>;
    checkApiKey: () => Promise<string | null>;
    notifyApiKeyUpdated: () => void;

    // 로스트아크 정보 관련 핸들러
    getNoticeInfo: () => Promise<LostarkNotice[]>;
    getEventInfo: () => Promise<LostArkEvent[]>;
    getContentInfo: () => Promise<CalendarResponse>;

    onMainProcessMessage: (callback: (message: MainProcessMessage) => void) => void;

    // ── 회의록 핸들러 ─────────────────────────────────────────────────
    meetingCreate: (payload: { title: string; participants: string[] }) => Promise<MeetingIpcResult<Meeting>>;
    meetingList: () => Promise<MeetingIpcResult<Meeting[]>>;
    meetingGet: (id: string) => Promise<MeetingIpcResult<Meeting>>;
    meetingUpdate: (id: string, data: Partial<Omit<Meeting, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<MeetingIpcResult<Meeting>>;
    meetingDelete: (id: string) => Promise<MeetingIpcResult>;
    meetingSaveAudio: (id: string, audioBuffer: ArrayBuffer) => Promise<MeetingIpcResult<{ audioPath: string }>>;
    meetingRunAIPipeline: (id: string) => Promise<MeetingIpcResult<Meeting>>;
    meetingCleanText: (id: string) => Promise<MeetingIpcResult<Meeting>>;
    meetingSummarize: (id: string) => Promise<MeetingIpcResult<Meeting>>;
    meetingExportWord: (id: string) => Promise<MeetingIpcResult<{ filePath: string }>>;
    meetingExportMarkdown: (id: string) => Promise<MeetingIpcResult<{ filePath: string }>>;
    meetingGetObsidianPath: () => Promise<{ success: boolean; path: string }>;
    meetingSetObsidianPath: () => Promise<{ success: boolean; path?: string; message?: string }>;
}

/**
 * @interface MainProcessMessage
 */
export interface MainProcessMessage {
    type: 'info' | 'warning' | 'error';
    content: string;
}

declare global {
  interface Window {
    lostarkAPI: IElectronAPI;
  }
}
