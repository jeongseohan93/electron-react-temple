import { Routes, Route } from 'react-router-dom'; 
import SideBar from '../dashboard/components/SideBar';
import TitleBar from '../../shared/component/WindowControls/TitleBar';
import { useWindowSize } from '../../shared/hooks/useWindoResize';
import style from './style/DashBoard.module.css';

const DashBoard = () => {
    useWindowSize(1200, 700);
  return (
    <div className={style.appLayout}>
      <TitleBar />
      <div className={style.mainContent}>
        <SideBar />
        <main className={style.contentArea}>
          <Routes>
           
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default DashBoard;