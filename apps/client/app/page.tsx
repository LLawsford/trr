"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter()
  async function handleJoinGameForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const gameRoomId = formData.get('roomId') as string
    const responsePromise = await fetch(`http://localhost:8000/rooms/${gameRoomId}`)
    const roomExists = await responsePromise.json()

    if (!roomExists) return toast.error("Please provide a valid game room id or create new room")

    router.push(`/gameRoom/${gameRoomId}`)
  }

  function newGame() {
    router.push(`/gameRoom/${crypto.randomUUID()}`)
  }


  return (
    <main className="w-full mx-auto p-10 md:w-3/4 lg:w-1/2">
      <form onSubmit={handleJoinGameForm} className="w-full">
        <Input className="mb-3" type="text" placeholder="Room id" name="roomId" />
        <Button className=" w-full">Join existing game</Button>
      </form>
      <p className="text-center my-5">OR</p>
      <Button className="w-full" onClick={newGame}>Create new game</Button>
    </main>
  );
}
