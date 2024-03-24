import { GameStatus, Player } from "contracts"
import { Server, Socket } from "socket.io"
import { gameRooms } from ".."
import { getSentence } from "../sentenceGenerator/sentenceGenerator"

export class GameRoom {
  gameStatus: GameStatus
  gameId: string
  players: Player[]
  playersQueue: Player[]
  io: Server
  gameHostId: string
  sentence: string
  timeLeft: number
  roundTime: number

  constructor(id: string, io: Server, hostId: string) {
    this.gameId = id
    this.players = []
    this.playersQueue = []
    this.gameHostId = hostId
    this.io = io
    this.gameStatus = 'AWAITING_PLAYERS'
    this.sentence = ''
    this.roundTime = 60
    this.timeLeft = this.roundTime
  }

  addPlayer(id: string, name: string, socket: Socket) {
    const newPlayer = this.newPlayer(id, name)
    console.log('new player joined the room', { id, name })

    // add player to queue if game is in progress
    if (this.gameStatus === 'IN_PROGRESS') {
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
    this.addClientListeners(socket)
  }

  newPlayer(id: string, name: string): Player {
    return { name, id, score: 0, accuracy: 0, liveInput: "", mistakenWords: new Set(), correctWords: new Set() }
  }

  async handleNewGame(socket: Socket) {
    // switch game status
    if (this.gameStatus === 'IN_PROGRESS') return socket.emit('error', 'Game has already started')

    // validate tricky players
    if (this.gameHostId !== socket.id) return socket.emit('error', 'Only host can start game')

    // add awaiting players & reset everybodys score
    this.addPlayersFromQueue()
    // TODO consider something for global leaders table

    await this.prepareNewGame()
    this.notifyRoomAboutPlayers()

    this.changeGameStatus('IN_PROGRESS')
    this.io.to(this.gameId).emit('game-started', this.sentence)
    this.gameInProgressCountdown()
  }

  async prepareNewGame() {
    this.resetPlayersScore()
    const sentenceResponse = await getSentence()
    this.sentence = sentenceResponse[0].quote
    this.timeLeft = this.roundTime
    this.changeGameStatus('AWAITING_PLAYERS')
  }

  gameInProgressCountdown() {
    this.setSecondsLeft(this.roundTime)
    const timer = setInterval(() => {
      this.timeLeft--
      this.io.to(this.gameId).emit('time-left', this.timeLeft)
      if (!this.timeLeft) {
        this.changeGameStatus('FINISHED')

        clearInterval(timer)
      }
    }, 1000)
  }

  setSecondsLeft(seconds: number) {
    this.timeLeft = seconds
  }

  changeGameStatus(status: GameStatus) {
    this.gameStatus = status
    this.io.to(this.gameId).emit('status-changed', status)
  }

  resetPlayersScore() {
    this.players = this.players.map(player => ({ ...player, score: 0, accuracy: 0, correctWords: new Set(), mistakenWords: new Set(), liveInput: '' }))
  }

  notifyRoomAboutPlayers() {
    this.io.to(this.gameId).emit('players', this.players)
  }

  addPlayersFromQueue() {
    this.players = [...this.players, ...this.playersQueue]
    this.playersQueue = []
  }

  addClientListeners(socket: Socket) {
    socket.on('start-game', async () => this.handleNewGame(socket))
    socket.on('player-keystroke', (key: string) => this.handlePlayerKeystroke(socket, key))
    socket.on('leave', () => this.handlePlayerLeftRoom(socket))
    socket.on('disconnect', () => this.handlePlayerLeftRoom(socket))
  }

  handlePlayerLeftRoom(socket: Socket) {
    console.log('player leaving room')
    socket.leave(this.gameId)
    this.players = this.players.filter(player => player.id !== socket.id)

    if (socket.id === this.gameHostId) {
      if (this.players.length) {
        this.gameHostId = this.players[0].id
        socket.emit('host', this.gameHostId)
        this.io.to(this.gameId).emit('player-left', socket.id)
      } else {
        gameRooms.delete(this.gameId)
      }
    }

    this.io.emit('players', this.players)
  }

  handlePlayerKeystroke(socket: Socket, input: string) {
    if (this.gameStatus !== 'IN_PROGRESS') return socket.emit('error', 'Game has not started yet')

    if (input.length) {
      let correctUntilNow = true
      let currentWordIndex = 0
      let madeMistake = false
      let fullWord = false
      for (let i = 0; i < input.length; i++) {
        if (correctUntilNow && this.sentence[i] === ' ') {
          currentWordIndex++
          fullWord = true
        }

        if (this.sentence[i] !== input[i]) {
          madeMistake = true
          correctUntilNow = false
        }

        if (madeMistake) {
          this.players.map(p => p.id === socket.id ? { ...p, mistakenWords: p.mistakenWords.add(currentWordIndex) } : p)
        }

        if (fullWord) {
          this.players.map(p => p.id === socket.id ? { ...p, mistakenWords: p.correctWords.add(currentWordIndex) } : p)
        }
      }

      if ((this.sentence.length === input.length) && !madeMistake) {
        socket.emit('full-correctness', socket.id)
      }
    }

    const player = this.getPlayer(socket)
    const correctWords = player?.correctWords.size || 0
    const mistakenWords = player?.mistakenWords.size || 0
    const accuracy = correctWords / (correctWords + mistakenWords)

    this.io.to(this.gameId).emit('player-score', { id: socket.id, score: Math.round((correctWords * this.roundTime) / (this.roundTime - this.timeLeft)), accuracy, liveInput: input.length > 50 ? input.slice(-50) : input })
  }

  getPlayer(socket: Socket): Player | undefined {
    return this.players.find(p => p.id === socket.id)
  }
}
