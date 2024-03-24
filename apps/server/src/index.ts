import { Server } from 'socket.io';
import { createServer } from 'http';
import express, { Express, Request } from 'express';
import helmet from 'helmet'
import dotenv from 'dotenv';
import cors from 'cors'
import { HTTP_METHODS, Player } from 'contracts';
import { GameRoom } from './GameRoom/GameRoom';

const PORT = process.env.PORT || 8000
const app: Express = express();
const http = createServer(app);

// middlewares etc.
app.use(helmet())
app.use(cors({ origin: ['http://localhost:3000'] }))
// TODO (opt) for now it is ok, to keep dotenv, but as project grows it's worth noting that turbo has mechanics to handle global env files: https://turbo.build/repo/docs/handbook/environment-variables
dotenv.config()

// http routes
// TODO validate all routes with zod
app.get('/rooms/:roomId', (req: Request<{ roomId: string }>, res) => {
  console.log('users checks room')
  res.send(gameRooms.has(req.params.roomId))
})

// io setup
const io = new Server(http, {
  cors: {
    methods: [HTTP_METHODS.GET, HTTP_METHODS.POST]
  }
});

// TODO add to api for leaders table to read
export const players = new Map<string, Player[]>()
export const gameRooms = new Map<string, GameRoom>()

// io routes
io.on('connection', (socket) => {
  console.log('new ws connection', socket.id)

  socket.on('join-room', (gameRoomId: string, name: string) => {
    console.log(name, 'wants to join game room:', gameRoomId)
    // const room = gameRooms.get(gameRoomId)
    // if (room && room.players.find(p => p.name === name) || room?.playersQueue.find(p => p.name === name)) {
    //   return socket.emit('error', 'name already taken in this room')
    // }
    socket.join(gameRoomId)

    if (gameRooms.has(gameRoomId)) {
      const gameRoom = gameRooms.get(gameRoomId)
      if (!gameRoom) return socket.emit('error', 'game room not found')
      gameRoom.addPlayer(socket.id, name, socket)
    } else {
      const game = new GameRoom(gameRoomId, io, socket.id)
      gameRooms.set(gameRoomId, game)
      game.addPlayer(socket.id, name, socket)
    }
  })
})

http.listen(PORT, () => console.log(`Hi from ${PORT}`))
