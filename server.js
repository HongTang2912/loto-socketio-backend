const app = require("express")();
const http = require("http");

const { Server } = require("socket.io");
const server = http.createServer(app);

const tables = require("./index");
require('dotenv').config()

const port = process.env.PORT || 3001;
const url = process.env.STATUS == 'production' ? process.env.PROD_URL :
  process.env.DEV_URL

const io = new Server(server, {
  cors: {
    origin: url,
    methods: ["GET", "POST"],
  },
});

let users = [];

let randomTables;
let eachRoomsNumbers = [];
let players_table;
let winner = [];

function resetByRoom(object, room_name, room_id) {
  console.log(`reset`);
  return object.filter(
    (u) => !object.filter((u) => u[room_name] == room_id).includes(u)
  );
}

function leaveID(socket) {
  const indexOfObject = users.findIndex((object) => {
    return object.id == socket.id;
  });

  const room = users[indexOfObject]?.room_id;
  const leaveUser = users[indexOfObject]?.id;

  if (room) {
    let index = eachRoomsNumbers?.findIndex((obj) => obj?.room == room);

    users.splice(indexOfObject, 1);
    if (index != -1) eachRoomsNumbers?.splice(index, 1);

    console.log("room ID: " + room);
    console.log("USer ID: " + leaveUser);

    const players = users.filter((u) => u.room_id == room);

    socket.to(room).emit("new-user", players);
  }
  console.log(
    "remain: ",
    users.filter((u) => u.room_id == room)
  );
}
const aTable = (index) => {
  return randomTables[players_table[index - 1] + ""];
};

io.on("connection", function (socket) {
  console.log(`User: ${socket.id}`);

  socket.on("join_room", function (room) {
    console.log(`User ${socket.id} joined room ${room}`);
    socket.join(room);
  });

  socket.on("get-user", function (user) {
    users.push({
      id: socket.id,
      player: user.player,
      room_id: user.room_id,
    });
    socket.to(user.room_id).emit(
      "new-user",
      users.filter((u) => u.room_id == user.room_id)
    );
    socket.emit(
      "new-user",
      users.filter((u) => u.room_id == user.room_id)
    );
  });

  socket.on("start-game", (players, rooms, isStarted) => {
    console.log(`players: ${players[0].player}, room: ${rooms}`);

    randomTables = tables.random.map((r) =>
      r?.map((_, colIndex) => r.map((row) => row[colIndex]))
    );
    players_table = tables.numbers.sort(() => 0.5 - Math.random());

    console.log(players_table);

    let roomNumbers = {
      randomNumbers: players_table,
      room: rooms,
      calledNumbers: [],
    };

    eachRoomsNumbers.push(roomNumbers);

    for (var i = 1; i <= players?.length; i++) {
      console.log(aTable(i));
      if (i == 1)
        socket.emit("new-game", aTable(i), !isStarted, players[i]?.player);
      else
        socket
          .to(players[i - 1]?.id)
          .emit("new-game", aTable(i), !isStarted, players[i]?.player);
    }


  });

  socket.on("call-number", (room, count, player) => {
    let index = eachRoomsNumbers?.findIndex((obj) => obj.room == room);
    console.log(eachRoomsNumbers[index]?.calledNumbers);

    eachRoomsNumbers[index]?.calledNumbers.push(
      eachRoomsNumbers[index]?.randomNumbers[count]
    );

    socket.emit(
      "get-number",
      eachRoomsNumbers[index]?.calledNumbers,
      count,
      player,
      room
    );

    socket
      .to(room)
      .emit(
        "get-number",
        eachRoomsNumbers[index]?.calledNumbers,
        count,
        player,
        room
      );
  });

  socket.on("end-game", (list, room) => {
    let checkArr = randomTables.map((t) =>
      t
        .map((t2) => {
          return t2.filter((a) => list.includes(a)).length;
        })
        .findIndex((a) => [5].includes(a))
    );

    for (let i = 0; i < users.filter((u) => u.room_id == room).length; i++) {
      if (
        checkArr[players_table[i]] != -1 &&
        checkArr[players_table[i]] >= 0 &&
        checkArr[players_table[i]] <= 4
      ) {
        winner.push(users.filter((u) => u.room_id == room)[i].player);
      }
    }

    // console.log();
    users = resetByRoom(users, "room_id", room);

    eachRoomsNumbers = resetByRoom(eachRoomsNumbers, "room", room);

    socket.emit("the-winner", list, room, winner);
    socket.to(room).emit("the-winner", list, room, winner);

    winner = [];
  });

  socket.on("disconnect", function (user) {
    console.log("User disconnected: " + socket.id);
  });
  socket.on("disconnecting", function () {
    leaveID(socket);
  });
});

server.listen(port, () => {
  console.log(`SERVER IS RUNNING ${port}, ${url}`);
});
