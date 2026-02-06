import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setApiKey } from '../../shared/redux/apiKey/apiSlice';
import { checkApiKey } from '../../shared/api/IpcApiKey';

/*
    애플리케이션 시작 시 저장된 API 키의 존재 여부를 확인하고, Redux 스토어를 초기화 하는 커스텀 훅
    이 훅은 비동기 작업의 진행 상태(loading)를 반환하며, UI에서 로딩 인디케이터를 표시하는 데 사용
*/
export const useApiKeyCheck = () => {
    // API 키 확인 작업의 로딩 상태를 관리하는 로컬 상태
    const [ isLoading, setIsLoading ] = useState(true);
    // Redux 스토어에 액션을 디스패치하기 위한 함수 참조
    const dispatch = useDispatch();

    // 컴포넌트 마운트 시, API 키 확인 로직을 한 번만 실행하기 위한 Effect
    useEffect(()=>{

        // Main Process에 API 키 조회를 요청하고, 결과를 Redux 스토어를 업데이트하는 비동기 함수
        const checkAndSetApiKey = async () => {
            try{
            
            // IPC 통신을 통해 Main Process로 부터 저장된 API 키를 비동기적으로 조회
            const existingKey = await checkApiKey();

                // 조회된 API 키가 존재하는 경우 ( null이나 undefined가 아님)
                if(existingKey){
                    // Redux 스토어에 상태를 조회된 키 값으로 설정(초기화)
                    dispatch(setApiKey(existingKey));
                }
            } catch (error) {
                console.error('API 키 확인 중 오류 발생:', error);
            } finally {
                /*
                    try/catch 블록 성공/실패 여부와 관계없이, 모든 작업이 완료되면 로딩상태를 false로 변경
                    이를 통해 UI는 로딩 상태를 해제하고 다음 화면을 렌더링
                */
                setIsLoading(false);
            }
        }

        // 정의된 비동기 함수를 즉시 호출하여 API 키 확인 프로세스를 시작
        checkAndSetApiKey();

        // dispatch 함수는 안정적이므로(stable), 이 effect는 마운트 시 한 번만 실행
    }, [dispatch]);

    // 현재 로딩 상태를 반환
    return isLoading;
}
