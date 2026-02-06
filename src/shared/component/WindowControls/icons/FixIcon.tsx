import { FiX } from 'react-icons/fi';
import { closeWindow } from '../../../api/IpcWindow';
import style from '../style/TitleBar.module.css';

const FixIcon = () => {
    
    /**
     * @description 애플리케이션 타이틀 바에 사용될 '종료' 버튼 컴포넌트입니다
     * 클릭 시 Main Process의 애플리케이션의 종료를 요청하는 IPC 통신을 수행
     * @returns {JSX.Element} 종료(X) 아이콘이 포함된 버튼 엘리먼트
     */
    return (
        // 버튼 클릭 시 IPC 서비스 함수('closeWindow') 를 직접 호출하여
        // Main Process에 애플리케시연 종료를 요청
        <button className={`${style.controlButton} ${style.closeButton}`} onClick={closeWindow}>
            <FiX className={style.icon} />
        </button>
    );
};

export default FixIcon;