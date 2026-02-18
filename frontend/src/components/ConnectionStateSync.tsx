import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAppDispatch } from '../store/hooks';
import { setConnectionStatus } from '../store/slices/connectionSlice';

export function ConnectionStateSync() {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const onConnect = () => dispatch(setConnectionStatus('connected'));
    const onDisconnect = () => dispatch(setConnectionStatus('reconnecting'));

    if (socket.connected) dispatch(setConnectionStatus('connected'));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket, dispatch]);

  return null;
}
