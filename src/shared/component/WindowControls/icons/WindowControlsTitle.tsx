import style from '../style/TitleBar.module.css';

const WindowControlsTitle = () => {
    
    /**
    * @description 애플리케이션 타이틀 바의 제목 텍스트를 표시하는 컴포넌트입니다.
    * @returns {JSX.Element} 애플리케이션 제목이 포함된 단락(<p>) 엘리먼트.
    */
    return (
        // CSS Modules를 사용하여 제목 텍스트의 스타일을 적용합니다.
        <p className={style.titlelabel}>Lost Ark Tools</p>
    );
};

export default WindowControlsTitle;