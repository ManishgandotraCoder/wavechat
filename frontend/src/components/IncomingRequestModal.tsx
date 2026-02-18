import { Modal } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setIncomingRequest } from '../store/slices/homeSlice';
import { useSocket } from '../contexts/SocketContext';


export function IncomingRequestModal() {
  const socket = useSocket();
  const dispatch = useAppDispatch();
  const incomingRequest = useAppSelector((state) => state.home.incomingRequest);
  const myId = useAppSelector((state) => state.session.connectionId);

  const handleAccept = () => {
    if (!incomingRequest || !myId) return;
    socket.emit('accept_request', { fromId: incomingRequest, toId: myId });
    dispatch(setIncomingRequest(null));
  };

  const handleCancel = () => {
    dispatch(setIncomingRequest(null));
  };

  return (
    <Modal
      open={!!incomingRequest}
      onCancel={handleCancel}
      onOk={handleAccept}
      okText="Accept"
      cancelText="Cancel"
      okButtonProps={{ 'data-testid': 'txt__accept' }}
      cancelButtonProps={{ 'data-testid': 'txt__cancel' }}
    >
      <p data-testid="txt__incoming-chat-request">
        User {incomingRequest} wants to chat.
      </p>
    </Modal>
  );
}
