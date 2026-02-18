import { createSlice } from '@reduxjs/toolkit';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface ConnectionState {
  status: ConnectionStatus;
}

const initialState: ConnectionState = {
  status: 'disconnected',
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnectionStatus(state, action: { payload: ConnectionStatus }) {
      state.status = action.payload;
    },
  },
});

export const { setConnectionStatus } = connectionSlice.actions;
export default connectionSlice.reducer;
