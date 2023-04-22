const http = require("http");
const tables = require(".");

const socketIo = require("socket.io");
require("dotenv").config();

const joinRoom = require('./modules/joinRoom');
const addUser = require('./modules/addUser');

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

const leaveID = (player) => {
  player[1]
    ? (users[player[1]] = users[player[1]]?.filter((u) => player[0] !== u.id))
    : null;
};

io.on("connection", function (socket) {
  console.log(`User: ${socket.id}`);

  socket.on("join_room", (room) => {joinRoom(socket, room)});

  socket.on("get-user", (user) => {addUser(socket, user, users)});

  socket.on("start-game", (startGameEmition) => {

    randomTables = tables.random.map((r) =>
      r?.map((_, colIndex) => r.map((row) => row[colIndex]))
    );
    players_table = tables.numbers.sort(() => 0.5 - Math.random());

    console.log(`call numbers array: ${JSON.stringify(players_table)}`);

    let roomNumbers = {
      randomNumbers: players_table,
      room: startGameEmition.room,
      calledNumbers: [],
    };

    eachRoomsNumbers[startGameEmition.room + ""] = roomNumbers;

    startGameEmition.players.forEach((p, index) => {
      console.log(aTable(index));

      const playerSlot = {
        table: aTable(index), 
        isStarted: true, 
        name: p?.player
      }

      // if (index == 0)
        socket.emit("new-game", playerSlot);
      // else
        socket.to(startGameEmition.room).emit("new-game", playerSlot);
    });
  });

  socket.on("call-number", (room, count, player) => {
    // let index = eachRoomsNumbers?.findIndex((obj) => obj.room == room);

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

  socket.on("end-game", (winner_name, room) => {
    let winner = [];


    winner.push(winner_name)

    delete users[room + ""];

    delete eachRoomsNumbers[room + ""];

    socket.emit("the-winner", winner);
    socket.to(room).emit("the-winner", winner);
    io.socketsLeave(room);
  });

  socket.on("disconnect", function (user) {
    console.log("User disconnected: " + socket.id);
  });
  socket.on("disconnecting", function () {
    // console.log(Array.from(socket.rooms));
    const p = Array.from(socket.rooms);
    leaveID(p);
    socket.to(p[1]).emit("new-user", users[p[1]]);
    socket.emit("new-user", users[p[1]]);
  });
});

httpServer.listen(port, () => {
  console.log(`SERVER IS RUNNING ${port}, ${url}`);
});
