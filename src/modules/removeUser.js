const removeUser =  (socket, user, allPlayers) => {
   

    // allPlayers[user.room_id + ""].push({
    //   id: user.p_id,
    //   player: user.player,
    // });
    console.log(user.id);
    
    allPlayers[user.room_id + ""] =  allPlayers[user.room_id + ""].filter((u) => {
        console.log( u.id );
        console.log( user.id );
        return u.id != user.id;
    })
    console.log(allPlayers[user.room_id + ""]);

    socket.to(user.room_id).emit("new-user", allPlayers[user.room_id + ""]);
    socket.emit("new-user", allPlayers[user.room_id + ""]);
  }
 
module.exports = removeUser