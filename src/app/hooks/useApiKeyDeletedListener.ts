import { useEffect } from "react"
import { useDispatch } from "react-redux";
import { setApiKey } from "../../shared/redux/apiKey/apiSlice";
import { onApiKeyDeleted } from "../../shared/api/IpcApiKey";

/*
    Main Process로부터 'API키 삭제' 이벤트를 수신하기 위한 Custom React Hook
    이 Hook을 사용하는 컴포넌트는 API 키가 삭제되었을 때, 전역 Redux 상태를 자동으로 업데이트
 */
export const useApiKeyDeletedListener = () => {

    // Redux store에 action을 보낼 수 있는 dispatch 함수를 가져옵니다.
    const dispatch = useDispatch();

    // 컴포넌트 생명주기(mount, unmount)에 맞춰 부수 효과(side effect)를 관리하기 위해 useEffect를 사용
    useEffect(()=> {

        /*
            'event:api-key-deleted' 이벤트 수신되었을 때 실행될 콜백 함수
            이 함수는 Redux의 apiKey 상태를 null로 업데이트
        */
        const handleApiKeyDeleted = () => {

            console.log('API 키 삭제 신호를 수신하여 상태를 null로 변경');
            //dispatch를 사용하여 setApiKey 액션을 실행하고, payload로 null을 전달
            dispatch(setApiKey(null));
        };

        /*  
            Main Process로 부터 오는 'api-key-deleted' 이벤트에 대한 리스너를 등록
            이 서비스 함수는 리스터를 해체하는 cleanup 함수를 반환 
        */
        const cleanup = onApiKeyDeleted(handleApiKeyDeleted);
        
        /*
            Effect의 cleanup 함수를 반환
            이 함수는 컴포넌트가 언마운트될 때 실행되어, 등록된 IPC 리스너를 해체하고 메모리 누수 방지
        */
        return cleanup;
        
        // dispatch 함수는 일반적으로 안정적이므로(stable), 이 effect는 컴포넌트 마운트 시 한 번만 실행
    }, [dispatch]);
}