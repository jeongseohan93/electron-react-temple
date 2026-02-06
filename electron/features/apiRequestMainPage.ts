import { ipcMain } from 'electron';
import { LostArkApiClient } from '../core/lostArkApiClient';
import { getApiKey } from '../core/apiKeyMangement';

// LostArkApiClient 인스턴스를 저장하기 위한 변수
// 앱 전체에서 단 하나의 API 클라이언트 인스턴스를 유지하기 위해 모듈 스코프에 선언
// 초기에는 클라이언트가 없으므로 null로 설정, 초기화 성공 시 인스턴스 할당(객체를 만들어 메모리에 할당)
let apiClient: LostArkApiClient | null = null;

// 저장된 API키를 사용하여 LostArkApiClient를 초기화하는 함수
// 앱이 시작될 때 호출되는 API를 사용할 준비
// 초기화 성공 여부를 boolean 값으로 반환
export const initializeApiClient = async () => {
    try { 

        // apiKeyMangement.ts에 정의된 함수를 통해 저장된 API 키를 비동기적으로 'apiKey' 상수에 할당
        const apiKey = await getApiKey();

        // 가져온 API 키를 사용하여 LostArkApiClient의 새 인스턴스를 생성
        apiClient = new LostArkApiClient(apiKey);
        console.log('로스트아크api 클라이언트 초기화 완');

        // 초기화 성공 시 true를 반환
        return true;
    } catch (error) {

        // API 키를 가져오거나 클라이언트 생성 중 오류가 발생하면 catch 블록 실행
        console.error('🚨 로스트아크 API 클라이언트 초기화 실패:', error);

        // 실패 시 apiClient를 다시 null로 설정, 잘못된 클라이언트가 사용되는 것 방지
        apiClient = null; 
        
        // 초기화 실패 시 false반환
        return false;
    }
}

// Renderer Process로 부터 API요청 처리하기 위한 IPC핸들러 모음
export const registerLostArkApiHandlers = async () => {
    const isInitialized = await initializeApiClient();

    // 공지사항 요청 핸들러
    // 'get:lostark-api-notices' 채널로 들어오는 invoke 요청 처리
    ipcMain.handle('get:lostark-api-notices', async () => {

        // API 클라이언트가 성공적으로 초기화되었는지 확인(매우 중요한 방어 코드)
        if(!isInitialized || !apiClient ) {

            // 초기화 실패 시, 에러를 발생시켜 Renderer Process에 실패 알림
            throw new Error('API 클라이언트가 준비되지 않았습니다. API 키를 확인해주세요.');
        }

        // 준비가 되었다면, apiClient 인스턴스를 통해 공지사항 정보를 요청하고 결과 반환
        return apiClient.getNotice();
    })

    // 이벤트 요청 핸들러
    // 'get:lostark-api-events' 채널로 들어오는 invoke 요청 처리
    ipcMain.handle('get:lostark-api-events', async () => {

        // API 클라이언트 초기화 상태 체크
        if (!isInitialized || !apiClient) {
            
            // 초기화 실패 시 에러 발생
            throw new Error('API 클라이언트가 준비되지 않았습니다. API 키를 확인해주세요.');
        }

        // 준비가 되었다면, apiClient 인스턴스를 통해 이벤트 정보를 요청하고 결과 반환
        return apiClient.getEvents();
    });

    // 캘린더 콘텐츠 요청 핸들러
    // 'get:lostark-api-calendar' 채널로 들어오는 invoke 요청 처리
    ipcMain.handle('get:lostark-api-calendar', async () => {

        // API 클라이언트 초기화 상태 체크
        if (!isInitialized || !apiClient) {

            // 초기화 실패 시 에러 발생
            throw new Error('API 클라이언트가 준비되지 않았습니다. API 키를 확인해주세요.');
        }
        
        // 준비가 되었다면, apiClient 인스턴스를 통해 켈린더 콘텐츠 정보를 요청하고 결과 반환
        return apiClient.getCalendar();
    });
}

