const tables = require(".");

require("dotenv").config();

const joinRoom = require('./modules/joinRoom');
const removeUser = require('./modules/removeUser');
const addUser = require('./modules/addUser');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = process.env.PORT;
const url = process.env.CLIENT_URL;


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

// generate cusomized ID for socket client
function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()?><":}{[]|\\';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

// io.engine.generateId = function (req) {
//     // generate a new custom id here
//     return makeid(15);
// }


io.on("connection", function (socket) {
  console.log(`User: ${socket.id}`);
  

  socket.on('remove-user', (user) => {removeUser(socket, user, users)});
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

      const playerSlot = {
        table: aTable(index), 
        isStarted: true, 
        name: p?.player
      }
      console.log(playerSlot);

      if (index == 0)
        socket.emit("new-game", playerSlot);
      else
        socket.to(p?.id).emit("new-game", playerSlot);
    });
  });

  socket.on("call-number", (room, count) => {
    // let index = eachRoomsNumbers?.findIndex((obj) => obj.room == room);

    eachRoomsNumbers[room + ""]?.calledNumbers.push(
      eachRoomsNumbers[room + ""]?.randomNumbers[count]
    );

    socket.emit(
      "get-number",
      eachRoomsNumbers[room + ""]?.calledNumbers,
      count,
    );


    socket
      .to(room)
      .emit(
        "get-number",
        eachRoomsNumbers[room + ""]?.calledNumbers,
        count,
      );
  });

  let winnerArray = [];
  socket.on("end-game", ({winner, room_id, rowNumbers}) => {
    
    

    winnerArray.push({
      winner,
      winnerNumbers: rowNumbers
    })

    delete users[room_id + ""];

    delete eachRoomsNumbers[room_id + ""];
    

    socket.emit("the-winner", winnerArray);
    socket.to(room_id).emit("the-winner",winnerArray);
    io.socketsLeave(room_id);
  });

  socket.on("disconnect", function () {
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

http.listen(port, () => {
  console.log(`SERVER IS RUNNING ${port}, ${url}`);
});
