import { NextResponse } from 'next/server'
import { createLottery, sweepStale } from '@/lib/lotteryStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Create a new lottery room. Returns its id and a host token the creator keeps
// to prove they may control the draw.
export async function POST() {
  sweepStale()
  const { id, hostToken } = createLottery()
  return NextResponse.json({ id, hostToken })
}
