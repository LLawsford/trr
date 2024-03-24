'use client'
import GameRoom from '@/components/ui/GameRoom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import React, { FormEvent } from 'react'
import { toast } from 'sonner'

export default function JoinGameRoom({
  searchParams, params
}: {
  searchParams: { playerName?: string },
  params: { gameRoomId: string }
}) {
  const router = useRouter()
  function handleNameAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const playerName = formData.get('playerName') as string

    // TODO zod validation
    toast(playerName)
    router.push(`/gameRoom/${params.gameRoomId}?playerName=${playerName}`)
  }

  if (!searchParams.playerName) return (
    <main className="w-full mx-auto p-10 md:w-3/4 lg:w-1/2">
      <form onSubmit={handleNameAction} className="w-full">
        <Input className="mb-3" type="text" placeholder="Type in your name..." name="playerName" />
        <Button className=" w-full" type="submit">Submit name</Button>
      </form>
    </main>
  )

  return (
    <GameRoom gameRoomId={params.gameRoomId} playerName={searchParams.playerName} />
  )
}
