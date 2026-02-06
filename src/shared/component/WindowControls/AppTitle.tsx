import style from './style/TitleBar.module.css';
import WindowControlsTitle from './icons/WindowControlsTitle';
import FiMinusIcon from './icons/FiMinusIcon';
import FixIcon from './icons/FixIcon';

const AppTitle = () => {

    /**
    * @description 애플리케이션의 커스텀 타이틀 바를 구성하는 메인 컴포넌트
    * 앱 제목과 최소화, 닫기 등의 윈도우 제어 버튼들을 조합하여 렌더링
    * @returns {JSX.Element} 완성된 타이틀 바 UI 엘리먼트
    */
    return (
        <div className={style.header}>
            {/* 앱 제목을 표시하는 텍스트 컴포넌트 */}
            <WindowControlsTitle />

            {/* 윈도우 제어 버튼들을 그룹화하는 컨테이너입니다. */}
            <div className={style.windowControls}>
                {/* 최소화 버튼 컴포넌트 */}
                <FiMinusIcon />
                {/* 닫기 버튼 컴포넌트 */}
                <FixIcon />
            </div>
        </div>
    );
};

export default AppTitle;