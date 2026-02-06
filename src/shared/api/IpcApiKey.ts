/**
 * @file API Key 관련 IPC 통신을 위한 서비스 모듈
 * Renderer Process의 다른 부분들이 직접 `window.lostarkAPI`에 의존하지 않도록
 * IPC 호출을 추상화하고 중앙에 관리
 */

/**
 * @interface SaveApiKeyResponse
 * @description API 키 저장과 같은 비동기 작업의 성공/실패 결과를 나타내는 응답 객체의 타입 정의
 */
interface SaveApiKeyResponse {

  // 작업의 성공 여부
  success: boolean;

  // 작업 실패 시 전달될 수 있는 선택적 오류 메시지
  message? : string;
}

/**
 * @description API키를 Main Process로 전달하여 안전하게 저장하도록 요청
 * @param apiKey 
 * @returns {Promise<SaveApiKeyResponse>} 저장 작업의 성공 여부와 메시지를 담은 Promise 객체
 */
export const saveApiKey = async (apiKey: string): Promise<SaveApiKeyResponse> => {

  // preload Script가 정상적으로 로드되었는지 확인하는 가드구문 
  if (!window.lostarkAPI) {
    throw new Error('IPC 통신을 사용할 수 없습니다.');
  }
  return window.lostarkAPI.saveApiKey(apiKey);
};

/**
 * @description Main Process에 저장된 API 키가 있는지 확인하고, 존재한다면 그 값을 가져옵니다.
 * @returns {Promise<string | null>} API 키가 존재하면 해당 문자열을, 존재하지 않거나 오류 발생 시 null을 담은 Promise객체
 */

export const checkApiKey = async (): Promise<string | null> => {
  if(!window.lostarkAPI) {

    // throw new Error() 대신 console.error와 null 반환으로 더 유연하게 처리.
    console.error('IPC Renderer is not available.');
    return null;
  }

  return window.lostarkAPI.checkApiKey();
  
}

/**
 * @description API 키가 업데이트되었음을 Main Process에 알리는 단방향(first-and-forget) 통신 수행
 * Main Process는 이 신호를 받아 내부 ApiClient를 재초기화
 */
export const notifyApiKeyUpdated = (): void => {
  if(!window.lostarkAPI) {
    console.error('IPC 통신을 사용할 수 없습니다.');
    return; 
  }

  window.lostarkAPI.notifyApiKeyUpdated();
}

/**
 * @description Main Process로 부터 'api-key-deleted' 이벤트가 발생했을 때 실행될 콜백 함수를 등록
 * @param { () => void } callback - 이벤트가 발생했을 때 호출될 함수
 * @returns { () => void } 등록된 이벤트 리스터를 제거(해제)하는 cleanup 함수.
 */
export const onApiKeyDeleted = (callback : () => void) : (() => void) =>  {
  if(!window.lostarkAPI) {
    // IPC 통신이 불가능할 경우, 아무 동작도 하지 않는 빈 cleanup 함수를 반환하여 오류를 방지
    return () => {};
  }

  // preload를 통해 Main Process의 이벤트 리스터를 등록
  window.lostarkAPI.onApiKeyDeleted(callback);

  // 이 리스너를 제거하는 cleanup 함수를 반환
  // React의 useEffect cleanup 함수 등에서 이 반환값을 사용하여 메모리 누수를 방지
  return () => {
    window.lostarkAPI?.removeApiKeyDeletedListener?.();
  };
};

/*
  1. 'throw new Error()' => 예외 던지기 방식
    
    - 동작:
      코드 실행을 그 자리에서 *즉시 중단*하고, 이 함수를 호출한 상위 코드로 오류를 전파
    
    - 책임:
      호출하는 쪽에서 *반드시 'tyr...catch'문을 사용하여 예외를 처리, 미처리 시 애플리케이션 전체가 멈출 위험이 있습니다.

    - 용도:
      복구가 불가능하거나 로직상 절대로 발생해서는 안 되는 *심각한/예외적인 오류*에 사용
      (예: 데이터 저장 실패, 네트워크 연결 불가)
      호출부에 오류 처리를 '강제'하는 수단

  2. 'console.error() + return null' (제어된 오류 처리 방식)

    - 동작: 
      개발자를 위한 콘솔에 오류를 기록하지만, 실행을 중단하지 않습니다.

    - 책임:
      호출하는 쪽에서 'try...catch' 없이 *'if(result === null)' 같은 조건문*으로 간단하게 실패 상황을 처리할 수 있습니다.

    - 용도:
      '검색 결과 없음(Not Found)'처럼 *충분히 예상 가능한 실패*에 사용합니다.
      특히 이 코드처럼, 호출부의 유연성을 높이고 싶을 때 매우 유용합니다.
  
 */