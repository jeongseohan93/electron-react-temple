import React from "react";

/**
 * @interface AppRoute
 * @description 애플리케이션의 단일 라우트(route) 객체의 구조를 정의하는 인터페이스
 * 이 구조는 라우팅 설정을 배열 형태로 관리하고, 중첩 라우터(nested routes)를 효율적으로 구현하는데 사용
 */
export interface AppRoute {
    
    /**
     * @description 라우터의 URL 경로
     * @example '/dashboard', '/setting', '*'
     */
    path: string;

    /**
     * @description 해당 경로(`path`)와 매칭될 때 렌더링될 React 컴포넌트
     * @example <DashboardPage />
     */
    element: React.ReactNode;

    /**
     * @description 현재 라우트 내에 중첩될 자식 라우트들의 배열입니다.
     * 중첩 라우트가 없는 경우 이 속성을 생략할 수 있습니다.
     * 주로 레이아웃 컴포넌트나 그룹화된 경로('/settings/profile', '/setting/account')를 정의할 때 사용됩니다.
     */
    children?: AppRoute[];
}