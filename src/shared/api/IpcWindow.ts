/**
 * @description Main Process에 메인 윈도우의 최소화 요청하는 단방향 IPC 호출을 실행합니다.
 */
export const minimize = () => {
    window.lostarkAPI?.minimizeWindow();
}

/**
 * @description Main Process에 메인 윈도우의 최대화/이전 크기로 복원을 토글(toggle)하도록 요청합니다.
 */
export const maximize = () => {
    window.lostarkAPI?.maximizeWindow();
}

/**
 * @description Main Process에 애플리케이션 종료를 요청합니다.
 */
export const closeWindow = () => {
    window.lostarkAPI?.closeWindow();
}

/**
 * @description Main Process에 주어진 URL을 사용자의 기본 웹 브라우저에서 열도록 요청합니다.
 * @param {string} url - 열고자 하는 외부 URL 주소
 * @warning 현재 구현에서는 `openExternalLink`가 반환하는 Promise를 반환하지 않아, 호출부에서 작업 결과를 알 수 없습니다.
 */
export const openExternal = (url: string) => {
    window.lostarkAPI?.openExternalLink(url);
}