import { NextResponse } from 'next/server'
import { getSnapshot } from '@/lib/lotteryStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Current snapshot of a lottery, or 404 if it doesn't exist (e.g. after a
// server restart).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const snap = getSnapshot(id)
  if (!snap) {
    return NextResponse.json({ error: 'Lottery not found' }, { status: 404 })
  }
  return NextResponse.json(snap)
}
