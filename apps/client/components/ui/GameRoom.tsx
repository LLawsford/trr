'use client'

import { useEffect, useState } from "react"
import { Socket, io } from "socket.io-client"
import { GameStatus, Player } from 'contracts'
import { toast } from "sonner"
import { Button } from "./button"
import { Textarea } from "./textarea"
import { columns } from "./PlayersTable"
import { DataTable } from "./DataTable"


export default function GameRoom({ gameRoomId, playerName }: { gameRoomId: string, playerName: string }) {
  const [socketIo, setSocketIo] = useState<Socket>()
  const [players, setPlayers] = useState<Player[]>([])
  const [gameRoomStatus, setGameRoomStatus] = useState<GameStatus>('AWAITING_PLAYERS')
  const [sentence, setSentence] = useState<string>('')
  const [gameHostId, setGameHostId] = useState<string>('')
  const [input, setInput] = useState<string>('')
  const [inputValid, setInputValid] = useState<boolean>(true)
  // TODO we got that on BE, there should be single source of truth
  const [timeLeft, setTimeLeft] = useState<number>(60)
  const [fullCorrectness, setFullCorrectness] = useState<boolean>(false)


  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS as string)

    setSocketIo(socket)

    socket.emit('join-room', gameRoomId, playerName)

    window.addEventListener('beforeunload', () => {
      socketIo?.emit('leave')
    });

    return () => {
      socket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!socketIo) return

    socketIo.on('connect', () => {
      console.log('connected to ws')
    })

    socketIo.on('game-started', (sentence: string) => {
      setSentence(sentence)
      setInput('')
      setFullCorrectness(false)
    })

    socketIo.on('status-changed', (status: GameStatus) => {
      setGameRoomStatus(status)
    })

    socketIo.on('players', (players: Player[]) => {
      setPlayers(players)
    })

    socketIo.on('host', (id: string) => {
      setGameHostId(id)
    })

    socketIo.on('error', (message: string) => {
      toast(message)
    })

    socketIo.on('player-left', ({ id }: { id: string }) => {
      toast(`player ${id} left the game`)
      setPlayers(previous => previous.filter(player => player.id !== id))
    })

    socketIo.on('time-left', (time: number) => {
      setTimeLeft(time)
    })

    socketIo.on('player-score', ({ id, score, accuracy, liveInput }: Player) => {
      setPlayers(previous => previous.map(player => (player.id === id ? { ...player, score, accuracy, liveInput } : player)))
    })

    socketIo.on('player-joined', (player: Player) => {
      setPlayers(previous => ([...previous, player]))
    })

    socketIo.on('full-correctness', (id: string) => {
      if (id === socketIo?.id) {
        setFullCorrectness(true)
      }
    })

    return () => {
      // TODO off all events
      socketIo.off('player-joined')
    }


  }, [socketIo])

  // useEffect for detecting changes in input paragraph
  useEffect(() => {
    if (!socketIo || gameRoomStatus !== "IN_PROGRESS") return;
    socketIo.emit("player-keystroke", input);

    // compare input and sentence
    if (!input.length) {
      setInputValid(true)
    }

    for (let i = 0; i < input.length; i++) {
      if (input[i] !== sentence[i]) {
        setInputValid(false)
        break
      }

      setInputValid(true)
    }
  }, [input]);


  function start() {
    if (!socketIo) return

    socketIo.emit('start-game')
  }

  function textAreaDynamicClass(): string {
    let result = ''
    // TODO gather into function
    if (!inputValid) result += "text-red-700 outline-red-700 border-red-700 focus-visible:ring-red-700 ring-transparent border-transparent"
    if (fullCorrectness) result += "text-green-700 outline-green-700 border-green-700 focus-visible:ring-green-700"

    return result
  }

  return (
    <main className="w-full p-10">
      <p className="text-4xl text-blue-200 font-bold mb-3 text-center">Room id: {gameRoomId}</p>

      <p className="text-5xl text-yellow-200 font-bold mb-3 text-center">Time left: {timeLeft}</p>
      <div className="w-screen p-10">
        <div>
          <h1 className="text-2xl font-bold mb-5">
            Players:
            <div className="mr-9 mt-3 h-full">
              <DataTable columns={columns} data={players} />
            </div>
          </h1>
        </div>

        <div>
          {gameRoomStatus === "AWAITING_PLAYERS" && (
            <div className="flex flex-col items-center justify-center p-10">
              <h1 className="text-2xl font-bold">
                Waiting for players ...
              </h1>

              {gameHostId === socketIo?.id && (
                // TODO validate button on server
                <Button className="mt-10 px-20" onClick={start} disabled={players.length < 2}>
                  Start Game
                </Button>
              )}
            </div>
          )}

          {gameRoomStatus === "IN_PROGRESS" &&
            <div className="h-full">
              <h1 className="text-2xl font-bold mb-5">
                Type in the sentence below:
              </h1>

              <div className="relative">
                <p className="text-xl lg:text-5xl p-5">{sentence}</p>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className={textAreaDynamicClass() + "w-full text-2xl lg:text-5xl outline-none p-5 absolute top-0 left-0 right-0 bottom-0 z-0 opacity-65"}
                  placeholder=""
                  disabled={fullCorrectness}
                  autoFocus
                />
              </div>
            </div>
          }

          {gameRoomStatus === "FINISHED" && (
            <div className="flex flex-col items-center justify-center p-10">
              <h1 className="text-2xl font-bold text-center">
                Game finished!
                {socketIo?.id === gameHostId && " Restart the game!"}
              </h1>

              {gameHostId === socketIo?.id && (
                <Button className="mt-10 px-20" onClick={start} disabled={players.length < 2}>
                  Start Game
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
