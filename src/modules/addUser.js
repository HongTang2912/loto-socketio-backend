const addUser =  (socket, user, allPlayers) => {
    allPlayers[user.room_id + ""] == undefined
      ? (allPlayers[user.room_id + ""] = [])
      : null;

    allPlayers[user.room_id + ""].push({
      id: user.p_id,
      player: user.player,
    });

    socket.to(user.room_id).emit("new-user", allPlayers[user.room_id + ""]);
    socket.emit("new-user", allPlayers[user.room_id + ""]);
  }
 
module.exports = addUser