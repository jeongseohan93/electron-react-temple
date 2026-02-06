import { BrowserWindow } from "electron";
import { registerWindowControlsHandlers } from './windowController'; // 창 제어 핸들러
import { registerSettingsHandlers } from "./settings"; // 설정 핸들러(API 키 관리(저장, 삭제, 체크), 설정 창 열기, 닫기, 삭제 시 설정 창 닫기)
import { registerLostArkApiHandlers } from './apiRequestMainPage';
import { registerApiManagement } from './apiKeyManagement';


// 애플리케이션 모든 주요 기능 IPC 핸들러를 중앙에서 등록하는 함수
// main.ts와 같은 메인 진입점 파일의 코드를 간결하게 유지시켜주는 역활
// 제어가 필요한 핸들러들에게 전달할 메인 BrowserWindow 인스턴스
export const registerFeatureHandlers = (win: BrowserWindow): void => {
    
    /* 
        창 제어 관련 핸들러
        기능 : 창 최소화, 최대화, 닫기 등 OS 표준 창 제어 기능
        'win' 전달 이유 : 어떤 창을 제어할지 알려주기 위함
    */
    registerWindowControlsHandlers(win);
    
    /*
        설정 창 관련 핸들러 
        기능 : 설정 창 열기/닫기, API 키 삭제 이벤트 수신 및 창 닫기
        'win' 전달 이유 : 설정 창을 메인 창의 자식으로 생성, 메인 창과 통신하기 위함
    */
    registerSettingsHandlers(win);

    /*
        API 키 관리 로직 핸들러
        기능 : API 키를 실제로 저장, 조회
    */
    registerApiManagement(); 

    /*
        로스트아크 메인 페이지(대쉬보드) API 요청 핸들러
        기능 : 공지사항, 이벤트, 켈린더 콘텐츠 정보 요청 처리, 즐겨찾기 아이템들 요청 처리
    */
    registerLostArkApiHandlers();
}