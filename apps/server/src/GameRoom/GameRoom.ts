import { GameStatus, Player } from "contracts"
import { Server, Socket } from "socket.io"
import { gameRooms } from ".."

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
  betweenRoundsTime: number

  constructor(id: string, io: Server, hostId: string) {
    this.gameId = id
    this.players = []
    this.playersQueue = []
    this.gameHostId = hostId
    this.io = io
    this.gameStatus = 'AWAITING_PLAYERS'
    this.sentence = ''
    this.roundTime = 20
    this.timeLeft = this.roundTime
    this.betweenRoundsTime = 10
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
    this.addClientListeners(socket)
  }

  isGameInProgress() {
    return this.gameStatus === 'IN_PROGRESS'
  }

  newPlayer(id: string, name: string): Player {
    return { name, id, score: 0, accuracy: 0, liveInput: "", mistakenWords: new Set(), correctWords: new Set() }
  }

  handleNewGame(socket: Socket) {
    // switch game status
    if (this.gameStatus === 'IN_PROGRESS') return socket.emit('error', 'Game has already started')

    // validate tricky players
    if (this.gameHostId !== socket.id) return socket.emit('error', 'Only host can start game')

    // add awaiting players & reset everybodys score
    this.addPlayersFromQueue()
    // TODO consider something for global leaders table

    // TODO change for real api when development done
    // const sentence = await getSentence()
    this.prepareNewGame()
    this.notifyRoomAboutPlayers()

    this.changeGameStatus('IN_PROGRESS')
    this.io.to(this.gameId).emit('game-started', this.sentence)
    this.gameInProgressCountdown()
  }

  prepareNewGame() {
    this.resetPlayersScore()
    this.sentence = 'hardcoded sentence'
    this.timeLeft = this.roundTime
    this.changeGameStatus('AWAITING_PLAYERS')
  }

  // FIXME NOT SOLID
  gameInProgressCountdown() {
    this.setSecondsLeft(this.roundTime)
    const timer = setInterval(() => {
      this.timeLeft--
      this.io.to(this.gameId).emit('time-left', this.timeLeft)
      if (!this.timeLeft) {
        // TODO could be joined in the future
        this.changeGameStatus('FINISHED')
        this.io.to(this.gameId).emit('game-finished')

        this.nextRoundCountdown()
        clearInterval(timer)
      }
    }, 1000)
  }

  setSecondsLeft(seconds: number) {
    this.timeLeft = seconds
  }

  // FIXME NOT SOLID
  nextRoundCountdown() {
    // TODO could be joined in the future
    this.changeGameStatus('AWAITING_PLAYERS')
    this.io.to(this.gameId).emit('awaiting-players')

    this.setSecondsLeft(this.betweenRoundsTime)
    const timer = setInterval(() => {
      this.timeLeft--
      this.io.to(this.gameId).emit('time-left', this.timeLeft)
      if (!this.timeLeft) {
        // TODO could be joined in the future
        this.changeGameStatus('IN_PROGRESS')
        this.io.to(this.gameId).emit('game-started', this.sentence)

        this.setSecondsLeft(10)
        this.prepareNewGame()
        this.gameInProgressCountdown()
        clearInterval(timer)
      }
    }, 1000)
  }

  changeGameStatus(status: GameStatus) {
    this.gameStatus = status
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
    socket.on('start-game', () => this.handleNewGame(socket))
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
    // TODO logic for keystrokes (loop through words)
    // count total words typed CORRECTLY into WPM score 
    // accuracy: correct keystrokes / total keystrokes * 100
    // TODO: fix score counting

    if (!this.isGameInProgress()) {
      return socket.emit('error', 'Game has not started yet')
    }

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

    this.io.to(this.gameId).emit('player-score', { id: socket.id, score: Math.round(correctWords * this.roundTime / (this.roundTime - this.timeLeft)), accuracy, liveInput: input.length > 50 ? input.slice(-50) : input })
  }

  getPlayer(socket: Socket): Player | undefined {
    return this.players.find(p => p.id === socket.id)
  }
}
