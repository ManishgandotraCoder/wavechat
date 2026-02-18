import { BrowserRouter, Routes as RouterRoutes, Route, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setIncomingRequest } from '../store/slices/homeSlice';
import { addActiveChat } from '../store/slices/chatSlice';
import { useSocket } from '../contexts/SocketContext';
import { ConnectionStateSync } from '../components/ConnectionStateSync';
import { IncomingRequestModal } from '../components/IncomingRequestModal';

import Chat from './Chat';
import Home from './Home';
import HeaderComponent from '../components/Header';
import { getOtherUserIdFromRoom } from '../utils/chat';

function RoutesContent() {
  const socket = useSocket();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { connectionId, name } = useAppSelector((state) => state.session);
  const myId = connectionId;

  // Re-register user on every connection (including refresh)
  useEffect(() => {
    if (!connectionId || !name) return;

    const handleConnect = () => {
      socket.emit('join', { connectionId, name });
    };

    socket.on('connect', handleConnect);
    return () => {
      socket.off('connect', handleConnect);
    };
  }, [socket, connectionId, name]);

  useEffect(() => {
    const handleIncomingRequest = ({ fromId }: { fromId: string }) => {
      dispatch(setIncomingRequest(fromId));
    };
    socket.on('incoming_request', handleIncomingRequest);
    return () => {
      socket.off('incoming_request', handleIncomingRequest);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    const handleChatStarted = ({
      roomId,
      users,
    }: { roomId: string; users?: { connectionId: string; name: string }[] }) => {
      if (!myId) return;
      const otherId = getOtherUserIdFromRoom(roomId, myId);
      const otherUser = users?.find((u) => u.connectionId !== myId);
      if (otherId) {
        dispatch(
          addActiveChat({
            roomId,
            otherUserId: otherId,
            otherUserName: otherUser?.name,
          })
        );
        navigate(`/chat/${roomId}`);
      }
    };
    socket.on('chat_started', handleChatStarted);
    return () => {
      socket.off('chat_started', handleChatStarted);
    };
  }, [socket, dispatch, navigate, myId]);

  return (
    <>
      <ConnectionStateSync />
      <HeaderComponent socket={socket} />
      <IncomingRequestModal />
      <RouterRoutes>
        <Route path="/" element={<Home socket={socket} />} />
        <Route path="/chat/:userId" element={<Chat socket={socket} />} />
      </RouterRoutes>
    </>
  );
}

export default function Routes() {
  return (
    <BrowserRouter>
      <RoutesContent />
    </BrowserRouter>
  );
}
