import { BACKEND_URL } from "./constant"
import type { Message } from "./types"

export async function getSchema(dbUrl: string) {
  const response = await fetch(`${BACKEND_URL}/schema`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ DB_URL: dbUrl }),
  })

  if (!response.ok) {
    throw new Error("Failed to fetch schema")
  }

  return await response.json()
}

export async function sendChatMessage(prompt: string, messages: Pick<Message, "role" | "content">[]) {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, messages }),
  })

  return await res.json()
}

export async function executeSQL(sql: string, dbUrl: string) {
  const res = await fetch(`${BACKEND_URL}/sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, DB_URL: dbUrl }),
  })

  return await res.json()
}
