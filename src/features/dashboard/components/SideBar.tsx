import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import style from '../style/SideBar.module.css';
import { FiMenu, FiHome, FiShoppingCart, FiRepeat, FiSearch, FiPackage, FiSettings } from "react-icons/fi";
import { FaLeaf } from 'react-icons/fa';
import { openSetting } from '../../../shared/api/IpcSetting';

const getNavLinkClass = ({ isActive }: { isActive: boolean }) => isActive ? `${style.menuButton} ${style.active}` : style.menuButton;

const SideBar = () => {
  
  const [ isCollapsed, setIsCollapsed ] = useState<boolean>(false); 

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  }

  return (
    <aside className={`${style.sidebar} ${ isCollapsed ?  style.collapsed : ''}`}>
      <nav className={style.menuNav}>
        <div className={style.menuGroup}>

          <button className={`${style.menuButton} ${style.toggleButton}`} onClick={handleToggleCollapse}>
            <FiMenu className={style.icon} />
            <span className={style.iconLabel}>{isCollapsed ? '펼치기' : '메뉴 접기'}</span>
          </button>

          <NavLink  to = "/" className={getNavLinkClass}> 
            <FiHome className={style.icon} />
            <span className={style.iconLabel}>대쉬보드</span>
          </NavLink>

          <NavLink to = "/market" className={getNavLinkClass}>
            <FiShoppingCart className={style.icon} />
            <span className={style.iconLabel}>거래소</span>
          </NavLink>

          <NavLink to = "/auction" className={getNavLinkClass}>
            <FiRepeat className={style.icon} />
            <span className={style.iconLabel}>경매장</span>
          </NavLink>

          <NavLink to = "/chSearch" className={getNavLinkClass}>
            <FiSearch className={style.icon} />
            <span className={style.iconLabel}>캐릭터 검색</span>
          </NavLink>

          <NavLink to = "/package" className={getNavLinkClass}>
            <FiPackage className={style.icon} />
            <span className={style.iconLabel}>패키지 효율</span>
          </NavLink>

          <NavLink to = "/lifeEnergy" className={getNavLinkClass}>
            <FaLeaf className={style.icon} />
            <span className={style.iconLabel}>생활의 기운 효율</span>
          </NavLink>

        </div>

        {/* 하단 메뉴 그룹 */}
        <div className={style.menuGroup}>
          <button className={`${style.menuButton} ${style.settingsButton}`} onClick={openSetting}>
            <FiSettings className={style.icon} />
            <span className={style.iconLabel}>설정</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default SideBar;