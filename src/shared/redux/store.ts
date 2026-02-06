import { configureStore } from "@reduxjs/toolkit";
import apiReducer from './apiKey/apiSlice'

/**
 * @description Redux Toolkit의 `configureStore` 함수를 사용하여 Redux 스토어를 생성하고 설정
 * 이 스토어는 애플리케이션의 모든 전역 상태를 담는 '단일 정보 소스(Single Source of Truth)'
 */
export const store = configureStore({
    // `reducer` 필드에 각 기능별 슬라이스(slice)에서 export한 리듀서들을 객체 형태로 등록
    // 여기에 등록된 키(`api`)가 Redux 스토어의 state 객체의 키가 됩니다
    reducer: { 
        api: apiReducer,
        // 다른 슬라이스가 있다면 여기에 추가
    },
})

/**
 * @description 스토어의 전체 상태에 대한 타입을 정의
 * `store.getState` 함수의 반환 타입을 그대로 사용하여, 스토어의 상태 구조가 변경될 때마다
 * 이 타입도 자동으로 업데이트되도록 합니다.
 * React-Redux의 `useSelector` 훅을 사용할 때 state의 타입을 지정하는 용도로 사용
 * @example `useSelector((state: RootState) => state.api.apiKey)`
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * @description 스토어의 `dispatch` 함수의 타입을 정의
 * 기본 액션뿐만 아니라, Redux Thunk와 같은 미들웨어가 처리하는 비동기 액션들의 타입까지
 * 정확하게 추론해줍니다.
 * `useDispatch` 훅을 타입과 함께 사용하기 위해 사용됩니다.
 * @example `const dispatch = useDispatch<AppDispatch>();`
 */
export type AppDispatch = typeof store.dispatch;

// 설정이 완료된 스토어 인스턴스를 애플리케이션 전체에서 사용할 수 있도록 export 
// 이 스토어는 앱의 최상위(index.tsx 등)에서 <Provider store={store}> 형태로 주입됩니다
export default store;