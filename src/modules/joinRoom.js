const joinRoom = (socket, room) =>{
    console.log(`User ${socket.id} joined room ${room}`);
    socket.join(room);
}

module.exports = joinRoom;