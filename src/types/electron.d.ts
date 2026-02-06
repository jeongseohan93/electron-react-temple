import { LostArkEvent, LostarkNotice, CalendarResponse } from "../features/dashboard/pages/mainPage/types/Lostark.types";

/**
 * @interface IElectronAPI
 * @description Electron의 `contextBridge`를 통해 Renderer Process에 노출되는 API의 전체 타입을 정의
 * 이 인터페이스는 Preload Script와 Renderer Process 간의 명세(contract) 역할
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
}

/**
 * @interface MainProcessMessage
 * @description Main Process에서 Renderer Process로 전달되는 일반 메시지의 구조를 정의합니다.
 * `onMainProcessMessage` 리스너의 콜백 함수에서 사용됩니다.
 */
export interface MainProcessMessage {

    /**
     * @description 메시지의 종류를 나타냅니다. (예: 정보, 경고, 오류)
     * @type {'info' | 'warning' | 'error'}
     */
    type: 'info' | 'warning' | 'error';

    /**
     * @description 메시지의 실제 텍스트 내용입니다.
     * @type {string}
     */
    content: string;
}

/**
 * @description 전역 `Window` 인터페이스를 확장(augmentation)하여 `lostarkAPI` 객체의 타입을 선언합니다.
 * 이 선언을 통해 TypeScript 컴파일러는 `window.lostarkAPI`의 존재와 그 내부에 포함된 함수들의 타입을
 * 인식할 수 있게 됩니다. 결과적으로 타입 안정성과 자동 완성(IntelliSense) 기능을 완벽하게 지원받을 수 있습니다.
 */
declare global {
  interface Window {
    lostarkAPI: IElectronAPI;
  }
}