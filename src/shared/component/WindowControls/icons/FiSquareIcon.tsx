import { FiSquare } from 'react-icons/fi';
import { maximize } from '../../../api/IpcWindow';
import style from '../style/TitleBar.module.css';

const FiSquareIcon = () => {
    
    /**
     * @description 애플리케이션 타이틀 바에 사용될 '최대화' 버튼 컴포넌트입니다
     * 클릭 시 Main Process의 창 최대화를 요청하는 IPC 통신을 수행
     * @returns {JSX.Element} 최대화 아이콘이 포함된 버튼 엘리먼트
     */
    return (
        // 버튼 클릭 시 IPC 서비스 함수('maximize') 를 직접 호출하여
        // Main Process에 창 최대화를 요청
        <button className={style.controlButton} onClick={maximize}>
            <FiSquare className={style.icon} />
        </button>
    );
};

export default FiSquareIcon;


