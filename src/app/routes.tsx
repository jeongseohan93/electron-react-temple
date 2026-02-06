import { useRoutes, Navigate, RouteObject } from 'react-router-dom';
import { useSelector} from 'react-redux';
import { RootState } from '../shared/redux/store';
import ApiInputMain from '../features/api-input/ApiInputMain';
import { useApiKeyCheck } from './hooks/useCheckApiKey';
import { useApiKeyDeletedListener } from './hooks/useApiKeyDeletedListener';
import DashBoard from '../features/dashboard/DashBoard';

/**
 * @description 애플리케이션의 핵심 라우팅 로직을 담당하는 컴포넌트
 * Redux 스토어 API 키 상태에 따라 조건부로 라우트를 구성,
 * 앱 초기화 중에는 로딩 상태를 표시하여 사용자 경험을 관리
 * @returns { JSX.Element | null } 현재 URL 경로에 맞는 페이지 컴포넌트 또는 로딩 UI
 */
const AppRoutes = () => {

    // Redux 스토어에서 API 키 상태를 체크, apiKey 값의 변화에 따라 이 컴포넌트 리렌더링
    const { apiKey } = useSelector((state: RootState) => state.api);

    // 앱 초기화 및 상태 동기화를 위한 커스텀 훅 실행
    // useApiKeyCheck: 앱 마운트 시 저장된 API 키를 확인하고 Redux 스토어를 초기화, 작업 완료 전까지 true인 로딩 상태를 반환
    const isLoading = useApiKeyCheck();

    //useApiKeyDeletedListener: Main Process에서 API 키 삭제 이벤트를 수신하여 Redux상태를 실시간으로 동기화하는 리스터 등록
    useApiKeyDeletedListener();

    // API 키의 존재 여부에 따라 라우트 구성을 동적으로 결정
    const routes: RouteObject[] = apiKey  ? [
        // API 키가 존재할 경우 (인증된 상태의 라우트)
        { 
            path: '/*', // 모든 경로 ('/dashboard', '/settings' 등)
            element: <DashBoard /> // 대시보드 페이지를 렌더링
        } 
    ] : [
        { 
            path: '/', // 루트 경로
            element: <ApiInputMain /> // API 키 입력 페이지를 렌더링
        },
        { 
            path: '*', // 위에서 정의되지 않은 모든 경로
            // 루트 경로('/')로 사용자를 리다이렉트시킵니다.
            // `replace` 옵션은 브라우저 히스토리에 현재 경로를 남기지 않아, 뒤로 가기 시 이전의 잘못된 경로로 돌아가는 것을 방지합니다.
            element: <Navigate to="/" replace /> 
        }
    ]

    // `react-router-dom`의 useRoutes 훅을 사용하여, 위에서 정의된 'routes'객체와
    // 현재 URL을 비교하여 렌더링할 React 엘리먼트를 결정
    const element = useRoutes(routes);

    // 초기 API 키 확인 작업이 진행 중일 때는 로딩 UI를 렌더링
    // 이는 비동기 작업이 완료되기 전에 발생할 수 있는 화면 깜빡임(flickering)이나
    // 의도치 않은 페이지(예: API 입력 페이지)가 잠시 보이는 것을 방지합니다.
    if (isLoading) {
        return <div>Loading...</div> 
    }

    // 로딩이 완료되면, useRoutes가 결정한 페이지 엘리먼트를 최종적으로 렌더링
    return element;
};

export default AppRoutes;