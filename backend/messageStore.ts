export interface StoredMessage {
  id: string;
  roomId: string;
  message: string;
  sender: string;
  timestamp: string;
  editedAt?: string;
  deletedAt?: string;
  readBy: Record<string, string>;
}

const messagesByRoom: Record<string, StoredMessage[]> = {};

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function getOrCreateRoom(roomId: string) {
  if (!messagesByRoom[roomId]) messagesByRoom[roomId] = [];
  return messagesByRoom[roomId];
}

export function getRoomMessages(roomId: string): StoredMessage[] {
  return messagesByRoom[roomId] ?? [];
}

export function addMessage(roomId: string, message: StoredMessage): StoredMessage {
  const room = getOrCreateRoom(roomId);
  room.push(message);
  return message;
}

export function findMessage(roomId: string, messageId: string): StoredMessage | undefined {
  const room = messagesByRoom[roomId];
  if (!room) return undefined;
  return room.find((m) => m.id === messageId);
}

export function editMessage(params: {
  roomId: string;
  messageId: string;
  editorId: string;
  newMessage: string;
  editedAt: string;
}): StoredMessage | null {
  const msg = findMessage(params.roomId, params.messageId);
  if (!msg) return null;
  if (msg.sender !== params.editorId) return null;
  if (msg.deletedAt) return null;
  msg.message = params.newMessage;
  msg.editedAt = params.editedAt;
  return msg;
}

export function deleteMessage(params: {
  roomId: string;
  messageId: string;
  deleterId: string;
  deletedAt: string;
}): StoredMessage | null {
  const msg = findMessage(params.roomId, params.messageId);
  if (!msg) return null;
  if (msg.sender !== params.deleterId) return null;
  if (msg.deletedAt) return msg;
  msg.message = '';
  msg.deletedAt = params.deletedAt;
  return msg;
}

export function markRead(params: {
  roomId: string;
  readerId: string;
  messageIds: string[];
  readAt: string;
}): { updatedMessageIds: string[]; readAt: string } {
  const { roomId, readerId, messageIds, readAt } = params;
  const room = messagesByRoom[roomId];
  if (!room) return { updatedMessageIds: [], readAt };

  const updated: string[] = [];
  for (const id of messageIds) {
    const msg = room.find((m) => m.id === id);
    if (!msg) continue;
    if (msg.sender === readerId) continue;
    if (msg.deletedAt) continue;
    if (msg.readBy[readerId]) continue;
    msg.readBy[readerId] = readAt;
    updated.push(id);
  }

  return { updatedMessageIds: updated, readAt };
}

export function clearRoom(roomId: string) {
  delete messagesByRoom[roomId];
}

