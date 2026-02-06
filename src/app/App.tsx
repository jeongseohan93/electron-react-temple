import AppRoutes from './routes';
import { BrowserRouter } from 'react-router-dom';

/**
 * @description React 애플리케이션의 최상위 루트(Root) 컴포넌트
 * 애플리게이션 전체의 라우팅 컨텍스트를 설정,
 * URL 경로에 따라 적절한 페이지를 렌더링하는 진입점 역활
 * @returns { JSX.Element } 라우팅이 적용된 애플리케이션의 메인 컴포넌트
 */
const App = () => {
  return (
    // `react-router-dom`의 BrowserRouter 컴포넌트
    // 이 컴포넌트로 앱을 감싸면 HTML5 History API를 사용하여 UI와 URL을 동기화하는
    // 클라이언트 사이드 라우팅 기능이 활성화
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;