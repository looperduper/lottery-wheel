import { NextResponse } from 'next/server'
import { startDraw, resetDraw, isHost, getLottery } from '@/lib/lotteryStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireHost(req: Request, id: string) {
  if (!getLottery(id)) return { error: 'Lottery not found', status: 404 }
  if (!isHost(id, req.headers.get('x-host-token'))) {
    return { error: 'Only the host can run the draw', status: 403 }
  }
  return null
}

// Host starts a draw. The server runs the whole spin timeline and streams it.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const denied = requireHost(req, id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const body = await req.json().catch(() => ({}))
  const count = Number(body?.count) || 1
  const ok = startDraw(id, count)
  if (!ok) {
    return NextResponse.json(
      { error: 'Cannot start draw (no players or a draw is already running)' },
      { status: 400 },
    )
  }
  return NextResponse.json({ ok: true })
}

// Host resets the result so the room can draw again.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const denied = requireHost(req, id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  resetDraw(id)
  return NextResponse.json({ ok: true })
}
