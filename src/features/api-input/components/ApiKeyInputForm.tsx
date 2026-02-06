import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { notifyApiKeyUpdated, saveApiKey } from '../../../shared/api/IpcApiKey'; // Main 프로세스와 통신하는 API함수
import { setApiKey } from '../../../shared/redux/apiKey/apiSlice'; // Redux의 상태를 변경하는 액션
import style from '../style/ApiInputMain.module.css';

// 사용자로 부터 로스트아크 API 키를 입력받아 저장하는 Form 컴포넌트
const ApiKeyInputForm = () => {

    // input 창의 텍스트 값을 저장하고 관리하기 위한 React state
    const [ inputKey, setInputKey ] = useState<string>('');

    // Redux store에 액션을 보내기 위한 dispatch함수
    const dispatch = useDispatch();

    // 사용자가 input 창에 텍스트를 입력할 때마다 호출되는 이벤트 핸들러
    const handleInputChange = ( e: React.ChangeEvent<HTMLInputElement>) => {
        setInputKey(e.target.value);
    }

    //사용자가 Form을 제출할 때 호출되는 이벤트 핸들러
    const handleSubmit = async ( e: React.FormEvent) => {

        console.log("시도중", inputKey);
        
        // Form 제출 시 발생하는 기본 동작인 페이지 새로고침을 막습니다.
        e.preventDefault();

        // 입력값이 비어있는지 확인
        if(inputKey.trim() === ''){
            alert('입력해야겠쥐?');
            return;
        }

        // API 통신은 실패할 수 있으므로 try...catch로 에러를 처리
        try {
            
            // Main 프로세스로부터 성공 응답
            const response = await saveApiKey(inputKey);

            // 성공하면 API 키를 저장하여 Redux의 전역 상태로 관리
            if(response.success) {
                notifyApiKeyUpdated();
                dispatch(setApiKey(inputKey));

                console.log('API 키가 성공적으로 저장되었습니다. 대시보드로 이동합니다.');
            } else {
                console.log('API 키 저장에 실패했습니다. 다시 시도해주세요.')
            }
        } catch (error) {
             console.error('API 키 저장 중 오류:', error);
        }
    }


    return (
        // form 제출 시 handleSubmit 함수가 실행
        <form className={style.form} onSubmit={handleSubmit}> 
            <input
                type="text"
                placeholder="API키 입력"
                className={style.input}
                value={inputKey}
                // input의 값이 변경될 때마다 handleInputChange 함수가 실행
                onChange={handleInputChange}
            />

            <button
                type="submit" 
                className={style.button}
            >
                로그인
            </button>

        </form>
    );
};

export default ApiKeyInputForm;