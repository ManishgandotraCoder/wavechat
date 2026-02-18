import { Socket } from 'socket.io';

export const registerTypingHandlers = (socket: Socket) => {

    socket.on('typing', ({ roomId }) => {
        const sender = socket.data.connectionId;
        if (!sender) return;

        socket.to(roomId).emit('user_typing', { userId: sender });
    });

    socket.on('stop_typing', ({ roomId }) => {
        const sender = socket.data.connectionId;
        if (!sender) return;

        socket.to(roomId).emit('user_stop_typing', { userId: sender });
    });

};
