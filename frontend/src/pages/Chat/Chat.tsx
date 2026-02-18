import { Socket } from 'socket.io-client';
import { Button, Input, Space, message, Modal, List, Drawer, Dropdown } from 'antd';
import { MenuOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addActiveChat,
  removeActiveChat,
  setMessagesForRoom,
} from '../../store/slices/chatSlice';
import type { ChatMessage } from '../../store/slices/chatSlice';
import { useChatSocket } from '../../hooks/useChatSocket';
import { getOtherUserIdFromRoom } from '../../utils/chat';
import { ActiveChatListItem } from './ActiveChatListItem';
import './styles.scss';

export default function Chat({ socket }: { socket: Socket }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const myId = useAppSelector((state) => state.session.connectionId);
  const otherUserId = getOtherUserIdFromRoom(userId ?? '', myId);
  const messages = useAppSelector((state) =>
    userId ? state.chat.messagesByRoom[userId] ?? [] : []
  );
  const isOtherOnline = useAppSelector((state) => state.chat.isOtherOnline);
  const isTyping = useAppSelector((state) => state.chat.isTyping);
  const activeChats = useAppSelector((state) => state.chat.activeChats ?? []);
  const messagesByRoom = useAppSelector((state) => state.chat.messagesByRoom);
  const onlineStatusByUser = useAppSelector((state) => state.chat.onlineStatusByUser ?? {});
  const connectionStatus = useAppSelector((state) => state.connection?.status ?? 'disconnected');
  const isConnected = connectionStatus === 'connected';

  const [input, setInput] = useState('');
  const [, contextHolder] = message.useMessage();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editingText, setEditingText] = useState('');
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const markReadSentRef = useRef<Set<string>>(new Set());

  useChatSocket(socket);

  useEffect(() => {
    if (!userId) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, userId]);


  useEffect(() => {
    if (!userId || !myId || !otherUserId) return;

    const chatExists = activeChats.some((chat) => chat.roomId === userId);
    if (!chatExists) {
      dispatch(addActiveChat({ roomId: userId, otherUserId }));
    }
  }, [userId, myId, otherUserId, dispatch, activeChats]);

  useEffect(() => {
    if (!socket || !userId || !otherUserId) return;

    const joinAndCheck = () => {
      socket.emit('join_room', { roomId: userId });
      socket.emit('check_user_online', { userId: otherUserId });
    };

    joinAndCheck();
    socket.on('connect', joinAndCheck);

    return () => {
      socket.off('connect', joinAndCheck);
    };
  }, [socket, userId, otherUserId]);

  useEffect(() => {
    if (!socket) return;
    activeChats.forEach((chat) => {
      socket.emit('check_user_online', { userId: chat.otherUserId });
    });
  }, [socket, activeChats]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleBeforeUnload = () => {
      socket.emit('end_chat', { roomId: userId });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!socket || !userId || !myId) return;
    const unreadIds = messages
      .filter((m) => m.sender !== myId && m.id && !(m.readBy && m.readBy[myId]) && !m.deletedAt)
      .map((m) => m.id as string);
    const toSend = unreadIds.filter((id) => !markReadSentRef.current.has(id));
    if (toSend.length > 0) {
      socket.emit('mark_read', { roomId: userId, messageIds: toSend });
      toSend.forEach((id) => markReadSentRef.current.add(id));
    }
  }, [socket, userId, myId, messages]);

  const handleSend = () => {
    if (!input.trim() || !userId || !isOtherOnline || !isConnected) return;

    socket.emit('send_message', {
      roomId: userId,
      message: input
    });

    socket.emit('stop_typing', { roomId: userId });
    setInput('');
  };

  const endChat = () => {
    if (!userId) return;
    setIsEndModalOpen(true);
  };

  const openEditModal = (msg: ChatMessage) => {
    if (!msg.id || msg.sender !== myId || msg.deletedAt) return;
    setEditingMessage(msg);
    setEditingText(msg.message);
    setEditModalOpen(true);
  };

  const submitEdit = () => {
    if (!userId || !editingMessage?.id || !editingText.trim()) return;
    socket.emit('edit_message', { roomId: userId, messageId: editingMessage.id, newMessage: editingText.trim() });
    setEditModalOpen(false);
    setEditingMessage(null);
    setEditingText('');
  };

  const openDeleteModal = (msg: ChatMessage) => {
    if (!msg.id || msg.sender !== myId || msg.deletedAt) return;
    setMessageToDelete(msg);
  };

  const confirmDelete = () => {
    if (!userId || !messageToDelete?.id) return;
    socket.emit('delete_message', { roomId: userId, messageId: messageToDelete.id });
    setMessageToDelete(null);
  };

  return (
    <div className="chat-page-container">
      {contextHolder}
      <Modal
        open={!!messageToDelete}
        title="Delete message?"
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
        onOk={confirmDelete}
        onCancel={() => setMessageToDelete(null)}
        destroyOnClose
      >
        This cannot be undone.
      </Modal>
      <Modal
        open={isEndModalOpen}
        title="End chat?"
        okText="End"
        cancelText="Cancel"
        onOk={() => {
          if (!userId) return;
          socket.emit('end_chat', { roomId: userId });
          // Clear messages for this room (initiator); other side clears via chat_ended
          dispatch(setMessagesForRoom({ roomId: userId, messages: [] }));
          dispatch(removeActiveChat(userId));

          const remainingChats = activeChats.filter((chat) => chat.roomId !== userId);
          console.log("remainingChats", remainingChats);

          const connectionsLeft = remainingChats.length;
          if (connectionsLeft === 0) {
            navigate('/');
          } else {
            navigate(`/chat/${remainingChats[0].roomId}`);
          }
          setIsEndModalOpen(false);
        }}
        onCancel={() => setIsEndModalOpen(false)}
      >
        Are you sure you want to end this chat?
      </Modal>

      <div className="chat-sidebar desktop-sidebar">
        <div className="sidebar-header">
          <h3>Active Chats</h3>
        </div>
        <List
          dataSource={activeChats.filter(
            (chat) => (messagesByRoom[chat.roomId]?.length ?? 0) > 0
          )}
          renderItem={(chat) => (
            <ActiveChatListItem
              key={chat.roomId}
              chat={chat}
              currentRoomId={userId}
              isOtherOnline={isOtherOnline}
              onlineStatusByUser={onlineStatusByUser}
              onSelect={() => navigate(`/chat/${chat.roomId}`)}
            />
          )}
        />
      </div>

      <Drawer
        title="Active Chats"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        className="mobile-sidebar-drawer"
        width={280}
      >
        <List
          dataSource={activeChats.filter(
            (chat) => (messagesByRoom[chat.roomId]?.length ?? 0) > 0
          )}
          renderItem={(chat) => (
            <ActiveChatListItem
              key={chat.roomId}
              chat={chat}
              currentRoomId={userId}
              isOtherOnline={isOtherOnline}
              onlineStatusByUser={onlineStatusByUser}
              onSelect={() => {
                navigate(`/chat/${chat.roomId}`);
                setDrawerVisible(false);
              }}
            />
          )}
        />
      </Drawer>

      <div className="chat-page">
        <div className="header">
          <div className="header-left">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              className="mobile-menu-button"
              aria-label="Open menu"
            />
            <div className='header-id-status'>
              <span data-testid="txt__other-user-id">{otherUserId}</span>
              <span className={isOtherOnline ? 'status-green' : 'status-gray'} />
            </div>
          </div>

          <Button type="primary" onClick={endChat} data-testid="txt__end-chat">
            End Chat
          </Button>
        </div>

        <div className="chat-window">
          {messages.map((msg, index) => {
            const key = msg.id ?? `${msg.timestamp}-${msg.sender}-${index}`;
            const isSent = msg.sender === myId;
            const isDeleted = Boolean(msg.deletedAt);
            const body = isDeleted ? 'Message deleted' : msg.message;
            const showActions = isSent && msg.id && !isDeleted;

            const menuItems: MenuProps['items'] = showActions
              ? [
                { key: 'edit', icon: <EditOutlined />, label: 'Edit', onClick: () => openEditModal(msg) },
                { key: 'delete', icon: <DeleteOutlined />, label: 'Delete', danger: true, onClick: () => openDeleteModal(msg) },
              ]
              : [];

            return (
              <div key={key} className={`message-row ${isSent ? 'message-row-sent' : 'message-row-received'}`}>
                {isSent ? (
                  <div className="sent-message-wrapper">
                    <div className="sent-message" data-testid={`txt__sent-message-${index}`}>
                      {body}
                      {msg.editedAt && <span className="message-edited-label"> (Edited)</span>}
                      {isSent && otherUserId && msg.readBy?.[otherUserId] && (
                        <span className="message-read-receipt" title="Seen"> Seen</span>
                      )}
                    </div>
                    {showActions && (
                      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          className="message-actions-btn"
                          aria-label="Message options"
                          title="Edit or delete"
                        />
                      </Dropdown>
                    )}
                  </div>
                ) : (
                  <div className="received-message" data-testid={`txt__received-message-${index}`}>
                    {body}
                    {msg.editedAt && <span className="message-edited-label"> (Edited)</span>}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </div>

        <Modal
          title="Edit message"
          open={editModalOpen}
          onOk={submitEdit}
          onCancel={() => { setEditModalOpen(false); setEditingMessage(null); setEditingText(''); }}
          okText="Save"
          destroyOnClose
        >
          <Input.TextArea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            rows={4}
            placeholder="Message"
          />
        </Modal>

        <div className="bottom-message">
          {isTyping && (
            <div className='typing-indicator'
              data-testid="txt__typing-indicator">
              {otherUserId} is typing...
            </div>
          )}
          {!isConnected && (
            <div className="offline-indicator" data-testid="txt__connection-offline">
              Disconnected. Reconnecting…
            </div>
          )}
          {isConnected && !isOtherOnline && (
            <div className='offline-indicator' data-testid="txt__offline-indicator">
              User is offline. Messages will be sent when they come online.
            </div>
          )}

          <Space.Compact className='width-100' size='large'>
            <label className="message-input-label" htmlFor="chat-message-input" data-testid="txt__placeholder-type-message">
              Type message
            </label>
            <Input
              id="chat-message-input"
              value={input}
              disabled={!isOtherOnline || !isConnected}
              onChange={(e) => {
                if (isOtherOnline && isConnected) {
                  setInput(e.target.value);
                  socket.emit('typing', { roomId: userId });
                }
              }}
              onBlur={() => {
                if (isOtherOnline && isConnected) {
                  socket.emit('stop_typing', { roomId: userId });
                }
              }}
              placeholder={!isConnected ? 'Reconnecting…' : isOtherOnline ? 'Type message' : 'User is offline'}
              data-testid="txt__message-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isOtherOnline && isConnected) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="primary"
              onClick={handleSend}
              disabled={!isOtherOnline || !isConnected}
              data-testid="txt__send">
              Send
            </Button>
          </Space.Compact>
        </div>
      </div>
    </div>
  );
}
