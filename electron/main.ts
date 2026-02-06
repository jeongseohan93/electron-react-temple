import { app, BrowserWindow } from 'electron';
import path from 'path';
import { createWindow } from './core/windows'; // 창 생성 함수
import { registerFeatureHandlers } from './features/index'; // 기능별 IPC 핸들러 등록 함수

// 현재 파일의 디렉토리 경로를 설정
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// --- 환경 변수 및 경로 설정 ---
// 프로젝트의 루트 경로를 환경 변수에 저장합
process.env.APP_ROOT = path.join(__dirname, '..');
// Vite 개발 서버 URL과 빌드된 렌더러 파일 경로를 export하여 다른 모듈(예: windows.ts)에서 사용할 수 있게 함
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
// public 디렉토리 경로를 환경 변수에 저장
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

// 메인 윈도우 인스턴스를 저장할 변수
let win: BrowserWindow | null;

// --- 앱 생명주기 이벤트 핸들링 ---
// 모든 창이 닫혔을 때 실행되는 이벤트
app.on('window-all-closed', () => {
  // macOS(darwin)가 아닌 경우, 앱을 완전히 종료합
  if (process.platform !== 'darwin') {
    app.quit();
    win = null; // 참조를 정리합니다.
  }
});

// 앱이 활성화되었을 때 실행되는 이벤트
app.on('activate', () => {
  // 열려 있는 창이 하나도 없을 경우에만 새 창을 생성
  if (BrowserWindow.getAllWindows().length === 0) {
    win = createWindow();
  }
});

// Electron 앱이 준비되면 실행되는 메인 로직
app.whenReady().then(() => {
  // 1. 메인 윈도우를 생성
  win = createWindow();
  // 2. 생성된 윈도우를 기반으로 모든 기능(IPC 핸들러)을 등록
  registerFeatureHandlers(win);

  // Vite 개발 서버 URL이 있는 경우 (개발 모드일 때)
    if (VITE_DEV_SERVER_URL) {
      // 개발 서버의 URL을 로드
      win.loadURL(VITE_DEV_SERVER_URL);
    } else {
      // 그렇지 않으면 빌드된 index.html 파일을 로드 (프로덕션 모드)
      win.loadFile(path.join(RENDERER_DIST, 'index.html'));
    }
});



