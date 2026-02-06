/**
 * @description 로스트아크 공지사항 목록을 Main Process를 통해 비동기적으로 요청
 * @return { Promise<LostarkNotice[]> } 성공 시 공지사항 데이터 배열을, 실패 시 에러를 반환gksms Promise
 */
export const getNotice = () => {
    if(!window.lostarkAPI) {
        throw new Error('IPC bridge is not available.')
    }
    return window.lostarkAPI.getNoticeInfo();
}

/**
 * @description 로스트아크 이벤트 목록을 Main Process를 통해 비동기적으로 요청
 * @returns { Promise<LostArkEvent[]>} 이벤트 데이터 배열을, 실패 시 에러를 담은 Promise
 */
export const getEvent = () => {
    if(!window.lostarkAPI) {
        throw new Error('IPC bridge is not available.')
    }
    return window.lostarkAPI.getEventInfo();
}

/**
 * @description 로스트아크 캘린더 콘테츠 정보를 Main Process를 통해 비동기적으로 요청
 * @returns @returns {Promise<CalendarResponse>} 캘린더 이벤트 데이터 배열을, 실패 시 에러를 담은 Promise
 */
export const getContentInfo = () => {
    if(!window.lostarkAPI) {
        throw new Error('IPC bridge is not available.')
    }
    return window.lostarkAPI.getContentInfo();
}