import { GameStatus, Player } from "contracts"
import { Server, Socket } from "socket.io"

export class GameRoom {
  gameStatus: GameStatus
  gameId: string
  players: Player[]
  playersQueue: Player[]
  io: Server
  gameHostId: string

  constructor(id: string, io: Server, hostId: string) {
    this.gameId = id
    this.players = []
    this.playersQueue = []
    this.gameHostId = hostId
    this.io = io
    this.gameStatus = 'AWAITING_PLAYERS'
  }

  addPlayer(id: string, name: string, socket: Socket) {
    const newPlayer = this.newPlayer(id, name)
    console.log('new player joined the room', { id, name })

    // add player to queue if game is in progress
    if (this.isGameInProgress()) {
      this.playersQueue.push(newPlayer)
      return socket.emit('error', 'Game is currently in progress :( please wait for a new round')
    }

    this.players.push(newPlayer)

    // notify room about new player
    this.io.to(this.gameId).emit('player-joined', newPlayer)

    // show new users all oponents and host
    socket.emit('players', this.players)
    socket.emit('host', this.gameHostId)

    // TODO add client events listeners
  }

  isGameInProgress() {
    return this.gameStatus === 'IN_PROGRESS'
  }

  newPlayer(id: string, name: string): Player {
    return { name, id, score: 0, accuracy: 0 }
  }
}
