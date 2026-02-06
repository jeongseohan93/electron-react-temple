import React from 'react';
import ReactDOM from 'react-dom/client';
import { closeSettingWindow } from '../../shared/api/IpcSetting';

const Settings = () => {

    const handleClose = () => {
        closeSettingWindow();
    }

    const handleDeleteApiKey = async () => {
        try {
            const response = await window.lostarkAPI.deleteApiKey();
            
            if(response.success) {
                console.log('API 키가 삭제되었습니다.');
            } else {
                console.log(`삭제 실패: ${response.message || '알 수 없는 오류'}`);
            }
        } catch (error: unknown) {
            console.error('API 키 삭제 중 오류 발생:', error);
        }
    };

    return (
        <div className="container" style={{ padding: '20px' }}>
            <h1>설정</h1>
            <button onClick={handleDeleteApiKey}>API 키 삭제</button>
            <hr style={{ margin: '20px 0' }} />
            <button onClick={handleClose}>닫기</button>
        </div>
    );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Settings />
    </React.StrictMode>
);