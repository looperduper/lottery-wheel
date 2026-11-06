import { randomBytes, randomUUID } from 'crypto'
import {
  LotterySnapshot,
  LotteryStatus,
  SPIN_MS,
  REST_MS,
} from './lotteryTypes'

// Server-side, in-memory lottery store. State lives in the Node process, so it
// is lost on restart and does not span multiple instances — fine for a single
// self-hosted container, matching this app's "no database" design.

type Subscriber = (snapshot: LotterySnapshot) => void

interface Lottery {
  id: string
  hostToken: string
  players: string[]
  winners: string[]
  status: LotteryStatus
  rotation: number
  spinning: boolean
  spinDurationMs: number
  numberOfWinners: number
  createdAt: number
  drawing: boolean
  subscribers: Set<Subscriber>
}

// Survive dev HMR / module reloads by hanging the map off globalThis.
const g = globalThis as unknown as { __lotteries?: Map<string, Lottery> }
const lotteries: Map<string, Lottery> = g.__lotteries ?? (g.__lotteries = new Map())

const MAX_NAME = 40
const MAX_PLAYERS = 200

function newId(): string {
  // Short, URL-friendly, hard to guess.
  let id = ''
  do {
    id = randomBytes(6).toString('base64url').slice(0, 8).toLowerCase()
  } while (lotteries.has(id))
  return id
}

export function snapshot(l: Lottery): LotterySnapshot {
  return {
    id: l.id,
    players: [...l.players],
    winners: [...l.winners],
    status: l.status,
    rotation: l.rotation,
    spinning: l.spinning,
    spinDurationMs: l.spinDurationMs,
    numberOfWinners: l.numberOfWinners,
    viewers: l.subscribers.size,
    createdAt: l.createdAt,
  }
}

function broadcast(l: Lottery) {
  const snap = snapshot(l)
  for (const sub of l.subscribers) {
    try {
      sub(snap)
    } catch {
      // A dead subscriber is cleaned up on its own stream close.
    }
  }
}

export function createLottery(): { id: string; hostToken: string } {
  const id = newId()
  const hostToken = randomUUID()
  lotteries.set(id, {
    id,
    hostToken,
    players: [],
    winners: [],
    status: 'idle',
    rotation: 0,
    spinning: false,
    spinDurationMs: SPIN_MS,
    numberOfWinners: 1,
    createdAt: Date.now(),
    drawing: false,
    subscribers: new Set(),
  })
  return { id, hostToken }
}

export function getLottery(id: string): Lottery | undefined {
  return lotteries.get(id)
}

export function getSnapshot(id: string): LotterySnapshot | undefined {
  const l = lotteries.get(id)
  return l ? snapshot(l) : undefined
}

export function isHost(id: string, token: string | null): boolean {
  const l = lotteries.get(id)
  return !!l && !!token && l.hostToken === token
}

/** Subscribe to live updates. Returns an unsubscribe function. */
export function subscribe(id: string, cb: Subscriber): (() => void) | null {
  const l = lotteries.get(id)
  if (!l) return null
  l.subscribers.add(cb)
  cb(snapshot(l)) // send current state immediately
  broadcast(l) // let others see the new viewer count
  return () => {
    l.subscribers.delete(cb)
    broadcast(l)
  }
}

export function addPlayer(id: string, name: string): boolean {
  const l = lotteries.get(id)
  if (!l || l.drawing) return false
  const clean = name.trim().slice(0, MAX_NAME)
  if (!clean || l.players.includes(clean) || l.players.length >= MAX_PLAYERS) return false
  l.players.push(clean)
  broadcast(l)
  return true
}

export function removePlayer(id: string, name: string): boolean {
  const l = lotteries.get(id)
  if (!l || l.drawing) return false
  l.players = l.players.filter(p => p !== name)
  broadcast(l)
  return true
}

export function clearPlayers(id: string): boolean {
  const l = lotteries.get(id)
  if (!l || l.drawing) return false
  l.players = []
  l.winners = []
  l.status = 'idle'
  broadcast(l)
  return true
}

export function resetDraw(id: string): boolean {
  const l = lotteries.get(id)
  if (!l || l.drawing) return false
  l.winners = []
  l.spinning = false
  l.status = 'idle'
  broadcast(l)
  return true
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Start a draw. The server orchestrates the whole timeline and broadcasts each
 * step, so the host and every viewer see the same wheel land on the same winner.
 */
export function startDraw(id: string, count: number): boolean {
  const l = lotteries.get(id)
  if (!l || l.drawing || l.players.length === 0) return false

  const n = l.players.length
  const k = Math.min(Math.max(1, Math.floor(count) || 1), n)

  l.drawing = true
  l.winners = []
  l.numberOfWinners = k
  l.status = 'spinning'

  const shuffled = [...l.players].sort(() => Math.random() - 0.5)
  const picked = shuffled.slice(0, k)

  const run = async () => {
    for (const name of picked) {
      const idx = l.players.indexOf(name)
      const segment = 360 / l.players.length
      // Bring segment center under the top pointer (pointer sits at 0°).
      const desiredMod = (360 - (((idx + 0.5) * segment) % 360)) % 360
      const currentMod = ((l.rotation % 360) + 360) % 360
      const delta = ((desiredMod - currentMod) % 360 + 360) % 360
      const extraTurns = l.winners.length === 0 ? 5 : 3

      l.rotation += extraTurns * 360 + delta
      l.spinning = true
      l.spinDurationMs = SPIN_MS
      l.status = 'spinning'
      broadcast(l)

      await sleep(SPIN_MS)

      l.spinning = false
      l.winners = [...l.winners, name]
      l.status = 'resting'
      broadcast(l)

      await sleep(REST_MS)
    }

    l.status = 'done'
    l.drawing = false
    broadcast(l)
  }

  void run()
  return true
}

// Occasionally drop lotteries nobody has touched in a day, so memory can't grow
// without bound on a long-running server.
const DAY = 24 * 60 * 60 * 1000
export function sweepStale() {
  const now = Date.now()
  for (const [id, l] of lotteries) {
    if (l.subscribers.size === 0 && now - l.createdAt > DAY) {
      lotteries.delete(id)
    }
  }
}
