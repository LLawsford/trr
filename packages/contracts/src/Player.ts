import { z } from 'zod'

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().min(0),
  accuracy: z.number().min(0).max(1),
  mistakenWords: z.set(z.number()),
  correctWords: z.set(z.number()),
  liveInput: z.string()
})

export type Player = z.infer<typeof playerSchema>
