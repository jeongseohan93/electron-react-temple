import { FiSettings } from 'react-icons/fi';
import { openSetting } from '../../../api/IpcSetting';
import style from '../style/TitleBar.module.css';

const FiSettingsIcon = () => {

    /**
     * @description 애플리케이션 타이틀 바에 사용될 '설정' 버튼 컴포넌트입니다
     * 클릭 시 Main Process의 설정 창 열도록 요청하는 IPC 통신을 수행
     * @returns {JSX.Element} 설정 아이콘이 포함된 버튼 엘리먼트
     */
    return (
        // 여러 CSS Module 클래스를 적용하기 위해 템플릿 리터럴을 사용
        // 버튼 클릭 시 IPC 서비스 함수('openSetting')를 호출
        // Main Process에서 설정 창 생성 요청 처리
        <button className={`${style.controlButton} ${style.settingsButton}`} onClick={openSetting}>
            <FiSettings className={style.icon} />
        </button>
    );
};

export default FiSettingsIcon;
