import style from './style/TitleBar.module.css';
import WindowControlsTitle from './icons/WindowControlsTitle';
import FiMinusIcon from './icons/FiMinusIcon';
import FixIcon from './icons/FixIcon';
import FiSquareIcon from './icons/FiSquareIcon';
import FiSettingsIcon from './icons/FiSettingsIcon';

const TitleBar = () => {

    /**
    *  @description 애플리케이션의 커스텀 타이틀 바를 구성하는 최상위 컴포넌트입니다.
    * 앱 제목과 모든 윈도우 제어 버튼(설정, 최소화, 최대화, 닫기)을 조합하여 최종 레이아웃을 완성합니다.
    *  @returns {JSX.Element} 완성된 타이틀 바 UI 엘리먼트.
    */
    return (
        // 타이틀 바 전체를 감싸는 최상위 컨테이너
        <div className={style.header}>
            {/* 앱 제목 텍스트 */}
            <WindowControlsTitle />

            {/* 윈도우 제어 버튼 그룹 */}
            <div className={style.windowControls}>
                {/* 설정 버튼 */}
                <FiSettingsIcon />
                {/* 최소화 버튼 */}
                <FiMinusIcon />
                {/* 최대화/복원 버튼 */}
                <FiSquareIcon />
                {/* 닫기(종료) 버튼 */}
                <FixIcon />
            </div>
        </div>
    );
};

export default TitleBar;