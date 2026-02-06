/**
 * @description Main Process에 설정 창 생성을 요청합니다.
 */
export const openSetting = () => {
    window.lostarkAPI?.openSettingWindow();
}

/**
 * @description Main Process에 설정 창을 닫도록 요청합니다.
 */
export const closeSettingWindow = () => {
    window.lostarkAPI?.closeSettingWindow();
}

/**
 * @description Main Process에 API 키 삭제를 요청하는 단방향(first-and-forget) IPC 호출을 실행합니다.
 * @note 이 함수는 작업 결과를 Promise로 반환하지 않습니다. 대신 Main Process는 이 요청을 처리한 후, 
 * 별도의 `event:api-key-deleted` 이벤트를 발생시켜 애플리케이션의 상태를 업데이트합니다.
 * (`useApiKeyDeletedListener` 훅이 이 이벤트를 수신하여 처리합니다.)
 */
export const apiKeyDeleted = () => {
    window.lostarkAPI.deleteApiKey();
}