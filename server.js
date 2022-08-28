const app = require('express')();
const http = require('http');

const { Server } = require('socket.io')
const server = http.createServer(app)

const tables = require('./index')

const port = process.env.PORT || 3000

// app.get('/', (req, res) => {
//     const cookies = require('cookie-universal')(req, res)
//     cookies.set('users', users)
// })
const io = new Server(server, {
    cors: {
        origin: "https://loto-next-app.herokuapp.com",
        methods: ["GET", "POST"]
    },
});

let users = []

let randomTables;
let eachRoomsNumbers = [];
let players_table;

io.on('connection', function (socket) {
    console.log(`User: ${socket.id}`)

    
   

    socket.on('join_room', function (room) {
        socket.join(room);
    })
    // console.log("User connected: " + socket.id)
    socket.on('get-user', function (user) {
        users.push({ id: socket.id, player: user.player, room_id: user.room_id })
        socket.to(user.room_id).emit("new-user", users.filter(u => u.room_id == user.room_id))
        socket.emit("new-user", users.filter(u => u.room_id == user.room_id))
    })


    socket.on("start-game", (players, rooms, isStarted) => {
        console.log(`players: ${players[0].player}, room: ${rooms}`)

        randomTables = tables.random
        players_table = tables.numbers.sort((a, b) => 0.5 - Math.random()).splice(0, players.length)
        console.log(players_table)
        for (let i = 0; i < players.length; i++) {
            console.log(randomTables[players_table[i] + ""])
        }

        let roomNumbers = {
            randomNumbers: tables.numbers.sort((a, b) => 0.5 - Math.random()),
            room: rooms,
            calledNumbers: []
        }

        eachRoomsNumbers.push(roomNumbers)

        for (var i = 0; i < players?.length; i++) {

            socket.to(players[i]?.id).emit("new-game", randomTables[players_table[i] + ""], !isStarted, players[i]?.player)
        }
        socket.emit("new-game", randomTables[players_table[0] + ""], !isStarted, players[0]?.player)
    })

    socket.on("call-number", (room, count, player) => {

        let index = eachRoomsNumbers?.findIndex((obj => obj.room == room))

        eachRoomsNumbers[index]?.calledNumbers.push(
            eachRoomsNumbers[index]?.randomNumbers[count]
        )

        socket.to(room).emit('get-number', eachRoomsNumbers[index]?.calledNumbers, count, player, room)
        socket.emit('get-number', eachRoomsNumbers[index]?.calledNumbers, count, player, room)
    })

    socket.on('end-game', (list, room) => {
        let winner;

        let checkArr = randomTables.map(t =>
            t.map(t2 => {
                return t2.filter(a => list.includes(a)).length
            }).findIndex((a) => [5].includes(a))
        )
        
        for (let i = 0; i < users.filter(u => u.room_id == room).length; i++) {
            if (checkArr[players_table[i]] != -1 && checkArr[players_table[i]] >= 0 && checkArr[players_table[i]] <= 4) {
                winner = users.filter(u => u.room_id == room)[i].player
            }
        }

        let index = eachRoomsNumbers?.findIndex((obj => obj.room == room))
        eachRoomsNumbers?.splice(index, 1)
        console.log(winner)

        socket.emit("the-winner", list, room, winner)
        socket.to(room).emit("the-winner", list, room, winner)

    })

    socket.on('disconnect', function (user) {
        console.log("User disconnected: " + socket.id)

    })
    socket.on('disconnecting', function () {

        io.emit("new-user", users.filter(u => !u.id.includes(leaveID(socket)[0])))
    });

    function leaveID(socket) {
        let arrRooms = []
        let rooms = socket.rooms;
        rooms.forEach(function (room) {
            arrRooms.push(room)
        })
        const indexOfObject = users.findIndex(object => {
            return object.id == socket.id;
        });
        users.splice(indexOfObject, 1)
        console.log(arrRooms[0])
        return arrRooms

    }
})

server.listen(port, () => {
    console.log("SERVER IS RUNNING");
})
