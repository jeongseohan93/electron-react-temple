import { ipcMain, BrowserWindow } from 'electron';
import { prisma } from '../core/database';
import { createSettingsWindow } from '../core/windows';
import { initializeApiClient } from './apiRequestMainPage';


/* 
  설정과 관련된 모든 IPC 핸들러 등록 함수
  (API 키 삭제, 설정 창 열기/닫기 )
  메인 BrowserWindow 설정 창의 부모 창으로 사용
*/
export const registerSettingsHandlers = (win: BrowserWindow): void => {
   
  /*
    API 키 삭제 (DELETE -> delete)
    Renderer Process(설정 창)로부터 'delete:api-key' 요청을 받아 비동기적으로 처리 
  */
  ipcMain.handle('delete:api-key', async (event) => {
    try{

      // Prisma 클라이언트를 사용하여 데이터베이스에서 API 키를 삭제
      await prisma.settings.delete({
        where: { key: 'api_key'},
      });

      /* 
        API 클라이언트를 다시 초기화
        키가 삭제되었으므로, apiClient 인스턴스가 null로 설정
      */
      await initializeApiClient();

      /* 
        메인 윈도우(DASHBOARD)에 키가 삭제되었음을 알리는 이벤트
        이를 통해 메인 윈도우는 API 입력 화면으로 돌아가는 등의 UI 변경 
      */
      win.webContents.send('event:api-key-deleted');

      // 이 IPC 이벤트를 보낸 설정 창을 찾아서 닫기
      const settingsWindow = BrowserWindow.fromWebContents(event.sender);
      settingsWindow?.close();
      
      // 성공적으로 처리되었음을 객체 형태로 Renderer Process에 반환
      return { success: true};

    } catch (error: unknown){
      console.error("API 키 삭제 실패:", error);
      
      // 실패 시 에러 정보를 담아 응답을 보냅니다.
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      return { success: false, message };
    }

  });
  
  /*
    설정 창 열기 핸들러
    'open:setting-window' 요청을 받으면 설정 창을 생성하는 함수 호출
  */
  ipcMain.handle('open:setting-window', () => {

    /*
      createSettingsWindow 함수에 메인 윈도우(win)를 인자로 넘겨
      설정 창이 메인 윈도우 자식 창으로 열리도록
    */
    createSettingsWindow(win);
  });
  
  /*
    설정 창 닫기 핸들러(단방향)
    'close:settings-window' 이벤트를 수신하면 창을 닫는다.
  */
  ipcMain.on('close:settings-window', (event) => {

        // event.sender를 통해 이벤트를 보낸 Renderer의 webContents를 가져옵니다.
        const webContents = event.sender;

        // webContents로 부터 BrowserWindow 인스턴스를 얻어옵니다.
        const window = BrowserWindow.fromWebContents(webContents);

        // 창이 존재하면 닫습니다.
        if (window) {
            window.close();
        }
    });
};

/*
  handle : 양방향 통신, Renderer의 invoke에 응답하며, Promise를 반환, 작업의 성공/실패 결과를 다시 Renderer로 보내야 할때

  on : 단방향 통신, Renderer의 send에 응답하며, 값을 반환하지 않습니다. 단순히 명령을 수신하여 실행만 하면 될때 적합

  event.sender : IPC 이벤트를 발생시킨 Renderer Process의 webContents 객체를 가리킵니다. 이를 통해 "어떤 창이 나에게 이 메세지를 보냇지?"를 파악하고 
  BrowserWindow.fromWebContents()를 이용해 해당 창을 직접 제어할 수 있습니다.
  
  상태 동기화 : await initializeApiClient() 호출하여 데이터베이스의 키가 삭제된 후, 메모리에서 실행 중인 apiClient의 상태도 즉시 동기화하여 일관성 유지
*/

