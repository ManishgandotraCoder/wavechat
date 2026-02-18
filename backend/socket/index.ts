import { Server, Socket } from 'socket.io';
import { registerChatHandlers } from './chatHandlers';
import { registerTypingHandlers } from './typingHandlers';
import { registerUserHandlers } from './userHandlers';
const onlineUsers: Record<string, string> = {};
const activeChats: Record<string, Set<string>> = {};

export const initSocket = (io: Server) => {
    io.on('connection', (socket) => {
        console.log('New connection:', socket.id);

        registerUserHandlers(io, socket, onlineUsers);
        registerChatHandlers(io, socket, onlineUsers, activeChats);
        registerTypingHandlers(socket);

        socket.on('disconnect', () => {
            const userId = socket.data.connectionId;
            if (!userId) return;

            console.log(`${userId} disconnected`);

            const userRooms = activeChats[userId];
            if (userRooms && userRooms.size > 0) {
                userRooms.forEach((roomId) => {
                    io.to(roomId).emit('chat_ended', { roomId });
                    const [id1, id2] = roomId.split('-');
                    if (activeChats[id1]) activeChats[id1].delete(roomId);
                    if (activeChats[id2]) activeChats[id2].delete(roomId);
                    if (activeChats[id1] && activeChats[id1].size === 0) delete activeChats[id1];
                    if (activeChats[id2] && activeChats[id2].size === 0) delete activeChats[id2];
                });
            }

            delete onlineUsers[userId];
            io.emit('user_offline', { userId });

        });
    });
}