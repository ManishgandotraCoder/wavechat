import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import type { Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addMessage,
  editMessage,
  deleteMessage,
  markMessagesRead,
  setOtherOnline,
  setTyping,
  removeActiveChat,
  setMessagesForRoom,
  setUserOnlineStatus,
  type ChatMessage,
} from '../store/slices/chatSlice';
import { getOtherUserIdFromRoom } from '../utils/chat';

export function useChatSocket(socket: Socket | null) {
  const { userId } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const myId = useAppSelector((state) => state.session.connectionId);
  const otherUserId = getOtherUserIdFromRoom(userId ?? '', myId);
  const activeChats = useAppSelector((state) => state.chat.activeChats ?? []);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (data: ChatMessage & { roomId?: string; id?: string; readBy?: Record<string, string> }) => {
      const roomId = data.roomId ?? userId;
      if (roomId) {
        dispatch(
          addMessage({
            roomId,
            message: {
              id: data.id,
              message: data.message,
              sender: data.sender,
              timestamp: data.timestamp,
              editedAt: data.editedAt,
              deletedAt: data.deletedAt,
              readBy: data.readBy ?? {},
            },
          })
        );
      }
    };

    const handleMessageEdited = (data: { roomId: string; messageId: string; message: string; editedAt: string }) => {
      dispatch(editMessage({ roomId: data.roomId, messageId: data.messageId, message: data.message, editedAt: data.editedAt }));
    };

    const handleMessageDeleted = (data: { roomId: string; messageId: string; deletedAt: string }) => {
      dispatch(deleteMessage({ roomId: data.roomId, messageId: data.messageId, deletedAt: data.deletedAt }));
    };

    const handleMessageRead = (data: { roomId: string; messageIds: string[]; readBy: string; readAt: string }) => {
      dispatch(markMessagesRead({ roomId: data.roomId, messageIds: data.messageIds, readBy: data.readBy, readAt: data.readAt }));
    };

    const handleChatEnded = (data?: { roomId?: string }) => {
      const endedRoomId = data?.roomId ?? userId;
      if (!endedRoomId) return;
      dispatch(setMessagesForRoom({ roomId: endedRoomId, messages: [] }));
      dispatch(removeActiveChat(endedRoomId));
      if (endedRoomId === userId) {
        const remainingChats = activeChats.filter((chat) => chat.roomId !== endedRoomId);
        if (remainingChats.length > 0) {
          navigate(`/chat/${remainingChats[0].roomId}`);
        } else {
          navigate('/');
        }
      }
    };

    const handleUserOnline = ({ userId: uid }: { userId: string }) => {
      if (uid === otherUserId) dispatch(setOtherOnline(true));
      dispatch(setUserOnlineStatus({ userId: uid, isOnline: true }));
    };

    const handleUserOffline = ({ userId: uid }: { userId: string }) => {
      if (uid === otherUserId) dispatch(setOtherOnline(false));
      dispatch(setUserOnlineStatus({ userId: uid, isOnline: false }));
    };

    const handleTyping = ({ userId: uid }: { userId: string }) => {
      if (uid === otherUserId) dispatch(setTyping(true));
    };

    const handleStopTyping = ({ userId: uid }: { userId: string }) => {
      if (uid === otherUserId) dispatch(setTyping(false));
    };

    const handleUserStatus = ({
      userId: uid,
      isOnline,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      if (uid === otherUserId) dispatch(setOtherOnline(isOnline));
      dispatch(setUserOnlineStatus({ userId: uid, isOnline }));
    };

    socket.on('receive_message', handleReceive);
    socket.on('chat_ended', handleChatEnded);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_read', handleMessageRead);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);
    socket.on('user_status', handleUserStatus);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('chat_ended', handleChatEnded);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_read', handleMessageRead);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
      socket.off('user_status', handleUserStatus);
    };
  }, [
    socket,
    userId,
    otherUserId,
    activeChats,
    dispatch,
    navigate,
  ]);
}
