import { app, ipcMain, BrowserWindow, shell} from 'electron';

/* 
  커스텀 타이틀바를 위한 창 제어(최소화, 최대화, 닫기 등)
  기타 창 관련 IPC 핸들러들을 등록하는 함수
  - 제어할 대상 BrowserWindow 인스턴스
*/
export const registerWindowControlsHandlers = (win: BrowserWindow): void => {
  
  /* 
    최소화 핸들러
    Renderer Process로부터 'minimize:window' 이벤트를 수신하면 창을 최소화
  */
  ipcMain.on('minimize:window', () => {
    win.minimize();
  });

  /*
    최대화/이전 크기로 복원 핸들러
    창의 현재 최대화 상태에 따라 동작을 토글
  */
  ipcMain.on('maximize:window', () => {

    // isMaximized() 메서드로 현재 창이 최대화 상태인지 확인
    if (win.isMaximized()) {

      // 이미 최대화 상태라면, 이전 크기로 복원
      win.unmaximize();
    } else {
      
      //최대화 상태가 아니라면, 창을 최대화
      win.maximize();
    }
  });
  
  /* 
    창 닫기 핸들러
    'close:window' 이벤트를 수신하면 앱 전체를 종료
  */
  ipcMain.on('close:window', () => {

    // win.close()는 해당 창만 닫는 반면, app.quit()는 창을 닫고 애플리케이션을 완전히 종료
    app.quit();
  });

  /* 
    창의 크기 조절 핸들러
    특정 크기로 창을 조절해야 할 때 사용
  */
  ipcMain.on('resize:window', (_event, { width, height}) => {
    if(win) {

      // setSize를 호출하기 전에 창이 리사이즈 가능하도록 설정 ( 초기 설정: resizable: false 였을 경우 대비)
      win.resizable = true;

      // win.setSize(가로, 세로, 애니메이션 여부) - 세 번째 인자를 true로 주면 macOS에서 부드럽게
      win.setSize(width, height, true);

      // 크기 변경 후 창을 화면 중앙으로 이동
      win.center();
    }
  })

  /*
    외부 링크 열기 핸들러
    보안을 위해 Renderer에서 직접 외부 링크를 열지 않고, Main Process를 통해
  */
  ipcMain.handle('shell:open-external', async (_, url: string) => {

    // 전달 받은 URL이 http/https 프로토콜로 시작하는지 확인
    // 이는 'file://'과 같은 로컬 파일 접근이나 다른 프로토콜을 통한 잠재적 보안 위협을 방지
    if(url.startsWith('http') || url.startsWith('https')) {

      // shell 모듈을 사용하여 사용자의 기본 앱 브라우저로 안전하게 링크
      await shell.openExternal(url);

      // 성공 여부 반환
      return{ success : true };
    }

    // 지원하지 않는 프로토콜인 경우, 실패 메시지 반환
    return { success: false, message: '지원하지 않는 프로토콜입니다.' };
  });
};