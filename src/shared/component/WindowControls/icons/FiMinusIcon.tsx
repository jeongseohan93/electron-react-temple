import { FiMinus } from 'react-icons/fi';
import { minimize } from '../../../api/IpcWindow';
import style from '../style/TitleBar.module.css';


/**
 * @description 애플리케이션 타이틀 바에 사용될 '최소화' 버튼 컴포넌트입니다.
 * 클릭 시 Main Process에 창 최소화를 요청하는 IPC 통신을 수행
 * @returns {JSX.Element} 최소화 아이콘이 포함된 버튼 엘리먼트
 */
const FiMinusIcon = () => {

    return (
        // 버튼 클릭 시 IPC 서비스 함수('minimize') 를 직접 호출하여
        // Main Process에 창 최소화를 요청
        <button className={style.controlButton} onClick={minimize}>
            <FiMinus className={style.icon} />
        </button>
    );
};

export default FiMinusIcon;
