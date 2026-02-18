import { createSlice } from '@reduxjs/toolkit';

interface SessionState {
  connectionId: string | null;
  name: string | null;
}

const initialState: SessionState = {
  connectionId: null,
  name: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action: { payload: { connectionId: string; name: string } }) {
      const { connectionId, name } = action.payload;
      state.connectionId = connectionId;
      state.name = name;
    },
    clearSession(state) {
      state.connectionId = null;
      state.name = null;
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
