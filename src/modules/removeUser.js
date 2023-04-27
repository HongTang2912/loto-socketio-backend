const removeUser =  (socket, user, allPlayers) => {
   

    if (user.id && allPlayers[user.room_id + ""]) {
      allPlayers[user.room_id + ""] =  allPlayers[user.room_id + ""].filter((u) => {
          
          return u.id != user.id;
      })
    }
    socket.to(user.room_id).emit("new-user", allPlayers[user.room_id + ""]);
    socket.emit("new-user", allPlayers[user.room_id + ""]);
  }
 
module.exports = removeUser