import { Server, Socket } from 'socket.io';

export const registerUserHandlers = (
    io: Server,
    socket: Socket,
    onlineUsers: Record<string, string>
) => {

    socket.on('join', ({ connectionId, name }) => {
        if (!connectionId) return;

        onlineUsers[connectionId] = socket.id;
        socket.data.connectionId = connectionId;
        socket.data.name = name;

        socket.emit('online_users', Object.keys(onlineUsers));
        socket.broadcast.emit('user_online', { userId: connectionId });

        console.log(`${name} (${connectionId}) online`);
    });

    socket.on('check_user_online', ({ userId }) => {
        const isOnline = !!onlineUsers[userId];
        socket.emit('user_status', { userId, isOnline });
    });

};
