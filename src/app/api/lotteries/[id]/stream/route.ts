import { subscribe, getLottery } from '@/lib/lotteryStore'
import { LotterySnapshot } from '@/lib/lotteryTypes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Server-Sent Events stream: pushes a full snapshot on every change so the host
// and all viewers stay in sync through the live draw.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!getLottery(id)) {
    return new Response('Lottery not found', { status: 404 })
  }

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let ping: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (snap: LotterySnapshot) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snap)}\n\n`))
        } catch {
          // Controller already closed.
        }
      }

      unsubscribe = subscribe(id, send)
      if (!unsubscribe) {
        controller.close()
        return
      }

      // Comment lines keep proxies from closing an idle connection.
      ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          // ignore
        }
      }, 25000)

      req.signal.addEventListener('abort', () => {
        if (ping) clearInterval(ping)
        unsubscribe?.()
        try {
          controller.close()
        } catch {
          // ignore
        }
      })
    },
    cancel() {
      if (ping) clearInterval(ping)
      unsubscribe?.()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
