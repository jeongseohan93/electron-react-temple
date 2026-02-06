import { useWindowSize } from '../../shared/hooks/useWindoResize';
import AppTitle from '../../shared/component/WindowControls/AppTitle';
import ApiKeyInputForm from '../api-input/components/ApiKeyInputForm';
import ApiInputFooter from '../api-input/components/ApiInputFooter';
import style from './style/ApiInputMain.module.css';

const ApiInputMain = () => {

    //창 사이즈 조절 훅
    useWindowSize(400, 400);

    return (
        <div className={style.pageContainer}>
            <AppTitle />
            <div className={style.Container}>
                <h1 className={style.logo}>
                    Lost Ark Tool
                </h1>

                <div className={style.formWrapper}>
                    <ApiKeyInputForm  />
                </div>
            </div>

            <ApiInputFooter />
        </div>

    );
};

export default ApiInputMain;