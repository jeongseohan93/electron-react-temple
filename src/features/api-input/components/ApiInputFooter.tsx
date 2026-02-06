import style from '../../api-input/style/ApiInputMain.module.css'

// 버젼 정보 (서버 없이 로컬에서 구동 되기에 직접적으로 변경)
const ApiInputFooter = () => {

    return(
        <div className={style.footer}>
                V 1.0.0
            </div>
    )
}

export default ApiInputFooter;