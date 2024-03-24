import { z } from 'zod'

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().min(0),
  accuracy: z.number().min(0).max(1),
})

export type Player = z.infer<typeof playerSchema>
