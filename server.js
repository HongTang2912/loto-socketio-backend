const app = require('express')();
const http = require('http');

const { Server } = require('socket.io')
const server = http.createServer(app)

const tables = require('./index')


const port = process.env.PORT || 3001


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

    socket.on('get-user', function (user) {
        users.push({ id: socket.id, player: user.player, room_id: user.room_id })
        socket.to(user.room_id).emit("new-user", users.filter(u => u.room_id == user.room_id))
        socket.emit("new-user", users.filter(u => u.room_id == user.room_id))
    })


    socket.on("start-game", (players, rooms, isStarted) => {
        console.log(`players: ${players[0].player}, room: ${rooms}`)

        randomTables = tables.random
        players_table = tables.numbers.sort((a, b) => 0.5 - Math.random())


        const aTable = (index) => {

            return randomTables[players_table[index - 1] + ""]?.map(t => t.sort((a, b) => 0.5 - Math.random()))

        }

        // for (let i = 0; i < players.length; i++) {
        //     console.log(aTable(i+1))
        // }


        let roomNumbers = {
            randomNumbers: players_table,
            room: rooms,
            calledNumbers: []
        }

        eachRoomsNumbers.push(roomNumbers)

        for (var i = 1; i <= players?.length; i++) {
            if (i <= 1) socket.emit("new-game", aTable(i), !isStarted, players[0]?.player)

            else socket.to(players[i - 1]?.id).emit("new-game", aTable(i), !isStarted, players[i]?.player)
        }
    })

    socket.on("call-number", (room, count, player) => {


        let index = eachRoomsNumbers?.findIndex((obj => obj.room == room))
        console.log(eachRoomsNumbers[index]?.calledNumbers)

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


        socket.emit("the-winner", list, room, winner)
        socket.to(room).emit("the-winner", list, room, winner)

    })

    socket.on('disconnect', function (user) {
        console.log("User disconnected: " + socket.id)
    })
    socket.on('disconnecting', function () {

        leaveID(socket)
    });

    function leaveID(socket) {

        const indexOfObject = users.findIndex(object => {
            return object.id == socket.id;
        });


        const room = users[indexOfObject]?.room_id
        if (room) {

            let index = eachRoomsNumbers?.findIndex((obj => obj?.room == room))

            console.log("index: " + index)
            if (index != -1) eachRoomsNumbers?.splice(index, 1)
            users.splice(indexOfObject, 1)

            console.log("room ID: " + room)

            const players = users.filter(u => u.room_id == room)

            for (var i = 1; i <= players?.length; i++) {
                

                socket.to(players[i - 1]?.id).emit("new-user", players)
            }

        }

    }
})

server.listen(port, () => {
    console.log("SERVER IS RUNNING");
})
