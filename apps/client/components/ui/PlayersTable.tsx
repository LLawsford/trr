"use client"

import {
  ColumnDef,
} from "@tanstack/react-table"
import { Player } from "contracts"

export const columns: ColumnDef<Player>[] = [
  {
    accessorKey: "liveInput",
    header: "Live input",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "score",
    header: "Score",
  },
  {
    accessorKey: "accuracy",
    header: "Accuracy",
  },
]

