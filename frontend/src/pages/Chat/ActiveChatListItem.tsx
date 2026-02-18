import { List } from 'antd';
import type { ActiveChat } from '../../store/slices/chatSlice';

interface ActiveChatListItemProps {
  chat: ActiveChat;
  currentRoomId: string | undefined;
  isOtherOnline: boolean;
  onlineStatusByUser: Record<string, boolean>;
  onSelect: () => void;
}

export function ActiveChatListItem({
  chat,
  currentRoomId,
  isOtherOnline,
  onlineStatusByUser,
  onSelect,
}: ActiveChatListItemProps) {
  const isActive = chat.roomId === currentRoomId;
  const isOnline = isActive
    ? isOtherOnline
    : (onlineStatusByUser[chat.otherUserId] ?? false);
  const displayName = chat.otherUserName ?? 'User';

  return (
    <List.Item
      className={`chat-list-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
    >
      <div className="chat-item-content">
        <span
          className={`chat-status-dot ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? 'Online' : 'Offline'}
        />
        <span className="chat-user-label">
          {displayName} ({chat.otherUserId})
        </span>
        {isActive && <span className="active-indicator">●</span>}
      </div>
    </List.Item>
  );
}
