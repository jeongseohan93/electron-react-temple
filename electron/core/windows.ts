import { BrowserWindow } from "electron";
import path from "node:path";
// main.ts에 정의된 Vite 개발 서버 Url과 렌더러 빌드 경로
import { VITE_DEV_SERVER_URL, RENDERER_DIST } from '../main';

// 현재 파일의 디렉토리 경로를 계산, ESM 환경에서 __dirname을 구현
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 설정 창 인스턴스를 저장할 변수(싱글톤 패턴으로 창이 하나만 열리도록 관리)
let settingsWin: BrowserWindow | null = null;

// 메인 창 생성 함수
export const createWindow = (): BrowserWindow => {

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // 기본 제목 표시줄 제거(커스텀 UI 사용 목적)
    webPreferences: { // 웹 페이지(렌더러 프로세스) 설정
        // 렌더러 프로세스가 로드되기 전에 실행될 스크립트 경로
        // 메인-렌더러 간의 안전한 통신(IPC) 브릿지 역활
      preload: path.join(__dirname, 'preload.mjs'),
      // 보안 설정: 렌더러 프로세스를 샌드박스 환경에서 실행
      contextIsolation: true,
    },
  });

  return win;
};
// 설정 창 생성 함수
export const createSettingsWindow = (parent: BrowserWindow): void => {
    // 이미 설정 창이 열려 있는 경우, 새로 만들지 않고 기존 창에 포커스
  if (settingsWin) {
    settingsWin.focus();
    return;
  }
  // 설정 창을 위한 새로운 브라우저 창 생성
  settingsWin = new BrowserWindow({
    width: 400,
    height: 500,
    parent: parent,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname,'preload.mjs'),
    },
  });

  if (VITE_DEV_SERVER_URL) {
    settingsWin.loadURL(`${VITE_DEV_SERVER_URL}/settings.html`);
  } else {
    settingsWin.loadFile(path.join(RENDERER_DIST, 'settings.html'));
  }

  // 창의 콘텐츠 렌더링이 완료되었을 때 한 번만 실행되는 이벤트
  // 이 때 창을 보여주면, 빈 화면이 깜빡이는 현상 없이 자연스럽게 나타남
  settingsWin.once('ready-to-show', () => {
    settingsWin?.show();
  });

  // 창이 닫혓을 때 실행되는 이벤트입니다.
  settingsWin.on('closed', () => {
    // 창이 닫혔으므로, 변수를 null로 초기화하여 다음에 다시 창을 열 수 있도록 준비
    settingsWin = null;
  });
};