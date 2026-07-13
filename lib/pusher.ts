import PusherServer from "pusher"
import PusherClient from "pusher-js"

const PUSHER_APP_ID = process.env.PUSHER_APP_ID || "mock_app_id"
const PUSHER_KEY = process.env.PUSHER_KEY || "mock_key"
const PUSHER_SECRET = process.env.PUSHER_SECRET || "mock_secret"
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || "mt1"

export const pusherServer = new PusherServer({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true,
})

export const getPusherClient = () => {
  return new PusherClient(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
  })
}
