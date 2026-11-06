// Shared, client-safe types for a live lottery room. No server-only imports
// here so both the API routes and the browser components can use it.

export type LotteryStatus = 'idle' | 'spinning' | 'resting' | 'done'

export interface LotterySnapshot {
  id: string
  players: string[]
  winners: string[]
  status: LotteryStatus
  /** Absolute cumulative wheel rotation in degrees (only ever increases). */
  rotation: number
  /** True while the wheel is mid-spin, so clients apply the CSS transition. */
  spinning: boolean
  /** Duration of the current spin, so every client animates identically. */
  spinDurationMs: number
  numberOfWinners: number
  /** Number of connected live viewers (including the host). */
  viewers: number
  createdAt: number
}

export const SPIN_MS = 2600
export const REST_MS = 750
export const SPIN_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'
