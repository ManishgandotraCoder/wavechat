import { createSlice } from '@reduxjs/toolkit';

export interface ChatMessage {
  id?: string;
  message: string;
  sender: string;
  timestamp: string;
  editedAt?: string;
  deletedAt?: string;
  readBy?: Record<string, string>;
}

export interface ActiveChat {
  roomId: string;
  otherUserId: string;
  otherUserName?: string;
}

interface ChatState {
  messagesByRoom: Record<string, ChatMessage[]>;
  isOtherOnline: boolean;
  isTyping: boolean;
  activeChats: ActiveChat[];
  onlineStatusByUser: Record<string, boolean>;
}

const initialState: ChatState = {
  messagesByRoom: {},
  isOtherOnline: false,
  isTyping: false,
  activeChats: [],
  onlineStatusByUser: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessagesForRoom(state, action: { payload: { roomId: string; messages: ChatMessage[] } }) {
      const { roomId, messages } = action.payload;
      state.messagesByRoom[roomId] = messages;
    },
    addMessage(state, action: { payload: { roomId: string; message: ChatMessage } }) {
      const { roomId, message } = action.payload;
      if (!state.messagesByRoom[roomId]) {
        state.messagesByRoom[roomId] = [];
      }
      state.messagesByRoom[roomId].push({
        ...message,
        readBy: message.readBy ?? {},
      });
    },
    editMessage(state, action: { payload: { roomId: string; messageId: string; message: string; editedAt: string } }) {
      const { roomId, messageId, message, editedAt } = action.payload;
      const room = state.messagesByRoom[roomId];
      if (!room) return;
      const msg = room.find((m) => (m.id ?? '') === messageId);
      if (msg) {
        msg.message = message;
        msg.editedAt = editedAt;
      }
    },
    deleteMessage(state, action: { payload: { roomId: string; messageId: string; deletedAt: string } }) {
      const { roomId, messageId, deletedAt } = action.payload;
      const room = state.messagesByRoom[roomId];
      if (!room) return;
      const msg = room.find((m) => (m.id ?? '') === messageId);
      if (msg) {
        msg.message = '';
        msg.deletedAt = deletedAt;
      }
    },
    markMessagesRead(state, action: { payload: { roomId: string; messageIds: string[]; readBy: string; readAt: string } }) {
      const { roomId, messageIds, readBy, readAt } = action.payload;
      const room = state.messagesByRoom[roomId];
      if (!room) return;
      const set = new Set(messageIds);
      room.forEach((m) => {
        if (m.id && set.has(m.id)) {
          if (!m.readBy) m.readBy = {};
          m.readBy[readBy] = readAt;
        }
      });
    },
    setOtherOnline(state, action: { payload: boolean }) {
      state.isOtherOnline = action.payload;
    },
    setTyping(state, action: { payload: boolean }) {
      state.isTyping = action.payload;
    },
    addActiveChat(state, action: { payload: ActiveChat }) {
      const { roomId } = action.payload;
      if (!state.activeChats) {
        state.activeChats = [];
      }
      if (!state.activeChats.find(chat => chat.roomId === roomId)) {
        state.activeChats.push(action.payload);
      }
    },
    removeActiveChat(state, action: { payload: string }) {
      if (!state.activeChats) {
        state.activeChats = [];
        return;
      }
      // Remove by roomId
      state.activeChats = state.activeChats.filter(chat => chat.roomId !== action.payload);
    },
    setUserOnlineStatus(state, action: { payload: { userId: string; isOnline: boolean } }) {
      const { userId, isOnline } = action.payload;
      if (!state.onlineStatusByUser) state.onlineStatusByUser = {};
      state.onlineStatusByUser[userId] = isOnline;
    },
    clearChatState(state) {
      state.messagesByRoom = {};
      state.isOtherOnline = false;
      state.isTyping = false;
      state.activeChats = [];
      state.onlineStatusByUser = {};
    },
  },
});

export const {
  setMessagesForRoom,
  addMessage,
  editMessage,
  deleteMessage,
  markMessagesRead,
  setOtherOnline,
  setTyping,
  addActiveChat,
  removeActiveChat,
  setUserOnlineStatus,
  clearChatState,
} = chatSlice.actions;
export default chatSlice.reducer;
