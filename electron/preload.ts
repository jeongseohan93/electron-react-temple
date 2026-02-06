import { MainProcessMessage } from '../src/types/electron';
import { contextBridge, ipcRenderer } from 'electron';

/*
    Preload Script
    Main Process(Node.js 환경)와 Renderer Process(웹 브라우저 환경) 사이의 안전한 다리 역활
    여기서 정의된 API들은 Renderer의 window 객체에 주입되어, 웹 페이지(React, Vue 등)에서 안전하게 Main Process의 기능 호출
*/
export const lostarkAPI = {

    /*
        창 제어 관련 (단방향 : Renderer -> Main)
        ipcRenderer.send: Main Process에 특정 작업을 '요청'만 하고 응답은 기다리지 않음 (Fire and Forget)
    */
    minimizeWindow: () => ipcRenderer.send('minimize:window'), // 메인 프로세스에 '창 최소화'를 요청
    maximizeWindow: () => ipcRenderer.send('maximize:window'), // 메인 프로세스에 '창 최대화'를 요청
    closeWindow: () => ipcRenderer.send('close:window'), // 메인 프로세스에 '앱 종료'를 요청
    resizeWindow: ( width:number, height:number ) => ipcRenderer.send('resize:window', {width, height}), // '창 크기 조절'을 데이터와 함께 요청

   // 설정 창 및 API 키 삭제 관련
    openSettingWindow: () => ipcRenderer.invoke('open:setting-window'), //설정 창 열기를 요청합니다.
    closeSettingWindow: () => ipcRenderer.send('close:settings-window'), // 설정 창 닫기를 요청합니다.
    deleteApiKey: () => ipcRenderer.invoke('delete:api-key'), // API 키 삭제를 요청하고, 성공/실패 결과를 응답받습니다.
    
    // API키 관리 핸들러 (저장, 체크)
    saveApiKey: (apiKey: string) => ipcRenderer.invoke('save:api-key', apiKey), // API 키 저장을 요청하고, 결과를 응답받습니다.
    checkApiKey: () => ipcRenderer.invoke('check:api-key'), // 저장된 API 키가 있는지 확인을 요청하고, 결과를 응답받습니다.

    //Main Process에서 보낸 'event:api-key-deleted' 이벤트를 수신(listen)하는 리스너를 등록합니다
    onApiKeyDeleted: (callback: () => void)=> {

        // 리스너 중복 등록을 방지하기 위해, 등록 전에 항상 기존 리스너를 모두 제거합니다.
        // React 컴포넌트가 리렌더링될 때마다 리스너가 계속 추가되는 것을 막아주는 필수 코드
        ipcRenderer.removeAllListeners('event:api-key-deleted');

        // Main Process로 부터 이벤트가 오면 등록된 콜백 함수를 실행
        ipcRenderer.on('event:api-key-deleted', callback);
    },

    // API 키가 업데이트되었음을 Main Process에 알리는 단방향 통신
    notifyApiKeyUpdated: () => ipcRenderer.send('api-key-updated'),

     /*
        등록했던 'event:api-key-deleted' 이벤트 리스너를 명시적으로 제거하는 함수
        컴포넌트가 언마운트될 때 호출하여 메모리 누수를 방지
     */
    removeApiKeyDeletedListener: () => ipcRenderer.removeAllListeners('event:api-key-deleted'),
    
    // 외부 링크 열기 핸들러(양방향)
    openExternalLink: (url: string) => ipcRenderer.invoke('shell:open-external', url), // 기본 브라우저로 링크 열기를 요청하고, 성공/실패를 응답받습니다.

    /**
     * Main Process에서 'main-process-message' 채널로 보내는 메시지를 수신하는 리스너를 등록합니다.
     * @param callback - 메시지를 받았을 때 실행할 콜백 함수.
     */
    onMainProcessMessage: (callback: (message: MainProcessMessage) => void) => {
        ipcRenderer.on('main-process-message', (_event, message: MainProcessMessage) => callback(message));
    }
    
}

// contextBridge를 사용하여 위에서 정의한 lostarkAPI 객체를 Renderer Process의 'window' 객체에 안전하게 노출
// 첫 번째 인자('lostarkAPI')가 window 객체에서 사용될 이름 (예: window.lostarkAPI.minimizeWindow())
// 이 방식을 통해 Renderer는 Node.js나 Electron의 모든 모듈에 직접 접근할 수 없으므로 보안 강화
contextBridge.exposeInMainWorld('lostarkAPI', lostarkAPI);

/*
    리스너 : 이벤트(사건)이 발생하기를 기다리다가, 특정 이벤트가 발생하면 약속된 동작(함수)을 실행하는 대상을 의미
    서버 : 리스너의 집합체
*/