import { createSlice } from '@reduxjs/toolkit';

interface HomeState {
  incomingRequest: string | null;
}

const initialState: HomeState = {
  incomingRequest: null,
};

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    setIncomingRequest(state, action: { payload: string | null }) {
      state.incomingRequest = action.payload;
    },
  },
});

export const { setIncomingRequest } = homeSlice.actions;
export default homeSlice.reducer;
