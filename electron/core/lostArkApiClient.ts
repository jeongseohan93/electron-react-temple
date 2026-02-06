import axios from 'axios';
import { LOSTARK_API } from './loatArkEndPoint'; // 로스트아크 API에 요청하는 엔드포인트 주소 

// 로스트 아크 API와 통신하기 위한 클라이언트 클래스 입니다.
// 이 클래스는 api 키를 사용하여 인증하고, 다양한 엔드포인트에 대한 요청을 보냅니다.
export class LostArkApiClient {

    // API 요청 시 인증에 사용될 api키를 저장하는 private 멤버 변수입니다.
    private apiKey: string;

    // LostArkApiClient의 새 인스턴스를 생성합니다.
    constructor(apiKey: string) {
        
        // api키가 로컬 db에 저장되어 있지만 혹시 모를 오류에 대비
        if(!apiKey) {
            throw new Error('API키가 필요합니다.');
        }
        // 제공된 apiKey를 클래스 인스턴스의 apiKey 속성에 할당
        this.apiKey = apiKey;
    }

    // API에 GET 요청을 보내는 private 메서드
    // 제너릭(<T>)을 사용하여 다양한 타입의 응답 데이터 처리
    private async _request<T>(endpint: string): Promise<T> {
        try{
            // axios.get을 사용하여 지정된 엔트포인트로 비동기 GET 요청
            // HTTP 헤더에 'authorization' 필드를 추가하여 API 키를 Bearer 토큰 형태로 전송
            const response = await axios.get<T>(endpint, {
                headers: { 'authorization': `bearer ${this.apiKey}` },
            });

            // 요청이 성공하면 응답 데이터 (response.data)를 반환
            return response.data;
        } catch (error) {
            // 요청 중 오류가 발생한 경우, 오류 처리
            if(axios.isAxiosError(error)) {
                const status = error.response ? error.response.status: '알 수 없음';
                throw new Error(`로스트아크 API 요청 실패: ${status}`);
            }

            // 일반적인 Error 객체인 경우
            if (error instanceof Error) {
                throw new Error(`로스트아크 API 요청 실패: ${error.message}`);
            }
            // 위 두 경우에 해당하지 않는 알 수 없는 오류인 경우
            throw new Error(`로스트아크 API 요청 실패: 알수 없는 오류`);
        }
    }

    // 로스트 아크 공지사항 목록을 가져옵니다.
    public getNotice() {
        return this._request(LOSTARK_API.NOTICES);
    }

    // 로스트 아크 이벤트 목록을 가져옵니다.
    public getEvents() {
        return this._request(LOSTARK_API.EVENTS);
    }

    // 로스트 아크 캘린터 콘텐츠 정보를 가져옵니다.
    public getCalendar() {
        return this._request(LOSTARK_API.CALENDAR);
    }
}

/* 
    _request 메서드 : 모든 API요청의 기반이 되는 핵심적인 private메서드, private으로 선언하여 클래스 외부에서는 직접 호출 불가, getNotice와 같은 public
    메서드를 통해서만 API요청이 이루어지도록 구조화 
*/

/*
    제네릭(<T>): _requeset<T>와 같이 제네릭을 사용하여, 각 API 엔드포인트가 반환하는 데이터 구조가 다드더라도 유연하게 타입을 지정하고 활용
*/