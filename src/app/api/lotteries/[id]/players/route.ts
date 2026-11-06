import { NextResponse } from 'next/server'
import {
  addPlayer,
  removePlayer,
  clearPlayers,
  isHost,
  getLottery,
} from '@/lib/lotteryStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function requireHost(req: Request, id: string) {
  if (!getLottery(id)) return { error: 'Lottery not found', status: 404 }
  if (!isHost(id, req.headers.get('x-host-token'))) {
    return { error: 'Only the host can change players', status: 403 }
  }
  return null
}

// Host adds a player.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const denied = requireHost(req, id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const body = await req.json().catch(() => ({}))
  const name = typeof body?.name === 'string' ? body.name : ''
  const ok = addPlayer(id, name)
  if (!ok) {
    return NextResponse.json(
      { error: 'Could not add player (empty, duplicate, or draw in progress)' },
      { status: 400 },
    )
  }
  return NextResponse.json({ ok: true })
}

// Host removes one player (?name=...) or clears all (?all=1).
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const denied = requireHost(req, id)
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status })

  const url = new URL(req.url)
  if (url.searchParams.get('all') === '1') {
    clearPlayers(id)
    return NextResponse.json({ ok: true })
  }
  const name = url.searchParams.get('name') ?? ''
  removePlayer(id, name)
  return NextResponse.json({ ok: true })
}
