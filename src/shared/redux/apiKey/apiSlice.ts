import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApiState } from './types/apiSlice.types';

/**
 * @description 이 슬라이스(slice)의 초기 상태(initial state)입니다.
 * 앱이 처음 로드될 때 apiKey는 존재하지 않으므로 null로 설정됩니다.
 */
const initialState: ApiState = {
  apiKey: null,
};

/**
 * @description API 관련 상태(현재는 API 키)를 관리하는 Redux 슬라이스입니다.
 * createSlice 함수는 리듀서, 액션 생성자(action creators), 액션 타입을 자동으로 생성해줍니다.
 */
const apiSlice = createSlice({
  // 슬라이스의 이름. 생성되는 액션 타입의 접두사로 사용
  name: 'api',
  // 이 슬라이스의 초기 상태 값
  initialState,
  // 상태를 어떻게 변경할지를 정의하는 리듀서 함수들의 모음
  reducers: {
    setApiKey: (state, action: PayloadAction<string | null> ) => {
      state.apiKey = action.payload;
    },
  },
});

// createSlice가 자동으로 생성한 액션 생성자(action creators)들을 export 합니다.
// 이제 React 컴포넌트에서 `dispatch(setApiKey('my-key'))`와 같이 사용할 수 있습니다.
export const { setApiKey } = apiSlice.actions;

// 생성된 리듀서 함수를 export
// 이 리듀서는 store/index.ts와 같은 중앙 스토어 설정 파일에서 다른 리듀서들과 결합
export default apiSlice.reducer;