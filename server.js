const http = require("https");
const tables = require(".");
const fs = require("fs");
const socketIo = require("socket.io");
require("dotenv").config();

const port = process.env.PORT;
const url = process.env.CLIENT_URL;


const httpServer = http.createServer();

const io = socketIo(httpServer);

let users = {};

let randomTables;
let eachRoomsNumbers = {};
let players_table;

const aTable = (index) => {
  return randomTables[players_table[index] + ""];
};

const leaveID = (socket, player) => {
  player[1]
    ? (users[player[1]] = users[player[1]]?.filter((u) => player[0] !== u.id))
    : null;
};

io.on("connection", function (socket) {
  console.log(`User: ${socket.id}`);

  socket.on("join_room", function (room) {
    console.log(`User ${socket.id} joined room ${room}`);
    socket.join(room);
  });

  socket.on("get-user", function (user) {
    users[user.room_id + ""] == undefined
      ? (users[user.room_id + ""] = [])
      : null;

    users[user.room_id + ""].push({
      id: socket.id,
      player: user.player,
    });

    console.log(users);
    socket.to(user.room_id).emit("new-user", users[user.room_id + ""]);
    socket.emit("new-user", users[user.room_id + ""]);
  });

  socket.on("start-game", (players, rooms, isStarted) => {
    // console.log(`players: ${players[0].player}, room: ${rooms}`);
    console.log(users);

    randomTables = tables.random.map((r) =>
      r?.map((_, colIndex) => r.map((row) => row[colIndex]))
    );
    players_table = tables.numbers.sort(() => 0.5 - Math.random());

    console.log(`call numbers array: ${JSON.stringify(players_table)}`);

    let roomNumbers = {
      randomNumbers: players_table,
      room: rooms,
      calledNumbers: [],
    };

    eachRoomsNumbers[rooms + ""] = roomNumbers;

    players.forEach((p, index) => {
      console.log(aTable(index));
      if (index == 0)
        socket.emit("new-game", aTable(index), !isStarted, p?.player);
      else
        socket.to(p?.id).emit("new-game", aTable(index), !isStarted, p?.player);
    });
  });

  socket.on("call-number", (room, count, player) => {
    // let index = eachRoomsNumbers?.findIndex((obj) => obj.room == room);
    console.log(eachRoomsNumbers[room + ""]?.calledNumbers);

    eachRoomsNumbers[room + ""]?.calledNumbers.push(
      eachRoomsNumbers[room + ""]?.randomNumbers[count]
    );

    socket.emit(
      "get-number",
      eachRoomsNumbers[room + ""]?.calledNumbers,
      count,
      player,
      room
    );

    socket
      .to(room)
      .emit(
        "get-number",
        eachRoomsNumbers[room + ""]?.calledNumbers,
        count,
        player,
        room
      );
  });

  let winner = [];
  socket.on("end-game", (list, room) => {
    let checkArr = randomTables.map((t) =>
      t
        .map((t2) => {
          return t2.filter((a) => list.includes(a)).length;
        })
        .findIndex((a) => [5].includes(a))
    );

    for (let i = 0; i < users[room + ""].length; i++) {
      if (
        checkArr[players_table[i]] != -1 &&
        checkArr[players_table[i]] >= 0 &&
        checkArr[players_table[i]] <= 4
      ) {
        winner.push(users[room + ""][i]?.player);
      }
    }

    // console.log();

    delete users[room + ""];

    delete eachRoomsNumbers[room + ""];
    // console.log(eachRoomsNumbers);

    socket.emit("the-winner", winner);
    socket.to(room).emit("the-winner", winner);
    io.socketsLeave(room);
    winner = [];
  });

  socket.on("disconnect", function (user) {
    console.log("User disconnected: " + socket.id);
  });
  socket.on("disconnecting", function () {
    // console.log(Array.from(socket.rooms));
    const p = Array.from(socket.rooms);
    leaveID(socket, p);
    socket.to(p[1]).emit("new-user", users[p[1]]);
    socket.emit("new-user", users[p[1]]);
  });
});

httpServer.listen(port, () => {
  console.log(`SERVER IS RUNNING ${port}, ${url}`);
});
