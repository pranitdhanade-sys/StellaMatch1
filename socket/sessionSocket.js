function sessionSocket(io) {
  io.on('connection', (socket) => {
    socket.on('join_private_room', ({ roomId }) => {
      socket.join(roomId);
    });

    socket.on('match_notification', ({ roomId, payload }) => {
      io.to(roomId).emit('match_notification', payload);
    });

    socket.on('session_message', ({ roomId, message, senderId, at }) => {
      io.to(roomId).emit('session_message', {
        roomId,
        message,
        senderId,
        at: at || new Date().toISOString()
      });
    });

    socket.on('disconnect', () => {
      // Client disconnected.
    });
  });
}

module.exports = sessionSocket;
