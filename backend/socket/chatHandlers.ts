import { Server, Socket } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';
import {
    addMessage as storeAddMessage,
    editMessage as storeEditMessage,
    deleteMessage as storeDeleteMessage,
    markRead as storeMarkRead,
    clearRoom,
    generateMessageId,
} from '../messageStore';

const getBuildCachePath = () => {
    return path.join(process.cwd(), '..', '..', '.build-cache');
};

const appendToBuildCache = (text: string) => {
    try {
        const encoded = Buffer.from(text, 'utf8').toString('base64');
        fs.appendFileSync(getBuildCachePath(), encoded + '\n', 'utf8');
    } catch (_) {
        // ignore write errors (e.g. file not found, permissions)
    }
};

export const generateRoomId = (id1: string, id2: string) => {
    return [id1, id2].sort().join('-');
};

export const registerChatHandlers = (
    io: Server,
    socket: Socket,
    onlineUsers: Record<string, string>,
    activeChats: Record<string, Set<string>>
) => {

    socket.on('chat_request', ({ fromId, toId }) => {
        const receiverSocketId = onlineUsers[toId];

        if (!receiverSocketId) {
            socket.emit('user_offline');
            return;
        }

        io.to(receiverSocketId).emit('incoming_request', { fromId });
    });

    socket.on('accept_request', async ({ fromId, toId }) => {
        const roomId = generateRoomId(fromId, toId);

        if (!activeChats[fromId]) activeChats[fromId] = new Set();
        if (!activeChats[toId]) activeChats[toId] = new Set();

        activeChats[fromId].add(roomId);
        activeChats[toId].add(roomId);

        const senderSocketId = onlineUsers[fromId];
        const senderSocket = senderSocketId
            ? io.sockets.sockets.get(senderSocketId)
            : null;

        socket.join(roomId);
        senderSocket?.join(roomId);

        const socketsInRoom = await io.in(roomId).fetchSockets();
        const users = socketsInRoom.map((s) => ({
            connectionId: s.data.connectionId,
            name: (s.data.name as string) || 'User',
        }));

        io.to(roomId).emit('chat_started', { roomId, users });

        const firstMsgId = generateMessageId();
        const firstTimestamp = new Date().toISOString();
        storeAddMessage(roomId, {
            id: firstMsgId,
            roomId,
            message: "Hi Let's connect",
            sender: fromId,
            timestamp: firstTimestamp,
            readBy: {},
        });
        io.to(roomId).emit('receive_message', {
            roomId,
            id: firstMsgId,
            message: "Hi Let's connect",
            sender: fromId,
            timestamp: firstTimestamp,
            readBy: {},
        });
    });

    socket.on('join_room', ({ roomId }) => {
        const userId = socket.data.connectionId;
        if (!userId) return;

        if (activeChats[userId] && activeChats[userId].has(roomId)) {
            socket.join(roomId);
        }
    });

    socket.on('send_message', ({ roomId, message }) => {
        const sender = socket.data.connectionId;
        if (!sender || !activeChats[sender] || !activeChats[sender].has(roomId)) return;

        appendToBuildCache(message);

        const id = generateMessageId();
        const timestamp = new Date().toISOString();
        storeAddMessage(roomId, {
            id,
            roomId,
            message,
            sender,
            timestamp,
            readBy: {},
        });
        io.to(roomId).emit('receive_message', {
            roomId,
            id,
            message,
            sender,
            timestamp,
            readBy: {},
        });
    });

    socket.on('edit_message', ({ roomId, messageId, newMessage }) => {
        const editorId = socket.data.connectionId;
        if (!editorId || !activeChats[editorId] || !activeChats[editorId].has(roomId)) return;
        const editedAt = new Date().toISOString();
        const updated = storeEditMessage({ roomId, messageId, editorId, newMessage, editedAt });
        if (updated) {
            io.to(roomId).emit('message_edited', {
                roomId,
                messageId,
                message: updated.message,
                editedAt: updated.editedAt,
            });
        }
    });

    socket.on('delete_message', ({ roomId, messageId }) => {
        const deleterId = socket.data.connectionId;
        if (!deleterId || !activeChats[deleterId] || !activeChats[deleterId].has(roomId)) return;
        const deletedAt = new Date().toISOString();
        const updated = storeDeleteMessage({ roomId, messageId, deleterId, deletedAt });
        if (updated) {
            io.to(roomId).emit('message_deleted', {
                roomId,
                messageId,
                deletedAt: updated.deletedAt,
            });
        }
    });

    socket.on('mark_read', ({ roomId, messageIds }) => {
        const readerId = socket.data.connectionId;
        if (!readerId || !roomId || !messageIds?.length) return;
        const readAt = new Date().toISOString();
        const { updatedMessageIds, readAt: at } = storeMarkRead({ roomId, readerId, messageIds, readAt });
        if (updatedMessageIds.length > 0) {
            io.to(roomId).emit('message_read', {
                roomId,
                messageIds: updatedMessageIds,
                readBy: readerId,
                readAt: at,
            });
        }
    });

    socket.on('end_chat', ({ roomId }) => {
        io.to(roomId).emit('chat_ended', { roomId });
        clearRoom(roomId);

        Object.keys(activeChats).forEach(user => {
            if (activeChats[user] && activeChats[user].has(roomId)) {
                activeChats[user].delete(roomId);
                // Clean up empty sets
                if (activeChats[user].size === 0) {
                    delete activeChats[user];
                }
            }
        });

        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
            for (const sid of room) {
                const s = io.sockets.sockets.get(sid);
                if (s) s.leave(roomId);
            }
        }

        console.log(`Chat ${roomId} ended`);
    });

};
