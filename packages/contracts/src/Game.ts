const GAME_STATUSES = {
  AWAITING_PLAYERS: "AWAITING_PLAYERS",
  IN_PROGRESS: "IN_PROGRESS",
  FINISHED: "FINISHED"
} as const

export type GameStatus = keyof typeof GAME_STATUSES

