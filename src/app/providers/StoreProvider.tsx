import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../shared/redux/store';

// StoreProvider 컴포넌트가 수신할 props의 타입 정의
interface StoreProviderProps {

  // 이 Provider 내부에 렌더링될 React 컴포넌트들
  children: React.ReactNode;
}

/**
 * @description React 애플리케이션 전체에 Redux 스토어를 제공(provide)하는 래퍼(Wrapper) 컴포넌트입니다.
 * 애플리케이션의 최상위 컴포넌트(일반적으로 App.tsx 또는 index.tsx)를 이 컴포넌트로 감싸서 사용합니다.
 * @param {StoreProviderProps} props - 컴포넌트의 props. `children`을 포함합니다.
 * @returns {JSX.Element} Redux Provider가 적용된 React 엘리먼트.
 */
const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return (
    // react-redux 라이브러리의 Provider 컴포넌트
    // `store` prop으로 애플리케이션 Redux 스토어 인스턴스를 전달받습니다.
    <Provider store={store}>
      {/*
        Provider의 자식으로 렌더링되는 모든 컴포넌트(그리고 그 하위의 모든 컴포넌트들)는
        이제 Redux 스토어에 접근할 수 있게 됩니다
        예를 들어, `useSelector`로 상태를 조회하거나 `useDispatch`로 액션을 전달할 수 있습니다.
      */}
      {children}
    </Provider>
  );
};

export default StoreProvider;