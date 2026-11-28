import PusherServer from "pusher"
import PusherClient from "pusher-js"

const PUSHER_APP_ID = process.env.PUSHER_APP_ID?.trim() || ""
const PUSHER_KEY = process.env.PUSHER_KEY?.trim() || ""
const PUSHER_SECRET = process.env.PUSHER_SECRET?.trim() || ""
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER?.trim() || "mt1"

const NEXT_PUBLIC_PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY?.trim() || ""
const NEXT_PUBLIC_PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER?.trim() || PUSHER_CLUSTER

export const isPusherConfigured = Boolean(PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET)

type PusherServerLike = {
  trigger: (
    channels: string | string[],
    event: string,
    data: unknown,
    params?: Record<string, unknown>
  ) => Promise<unknown>
}

export const pusherServer: PusherServerLike = isPusherConfigured
  ? new PusherServer({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    })
  : {
      async trigger() {
        return undefined
      },
    }

export const getPusherClient = (): PusherClient | null => {
  if (!NEXT_PUBLIC_PUSHER_KEY) {
    return null
  }
  return new PusherClient(NEXT_PUBLIC_PUSHER_KEY, {
    cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
  })
}
