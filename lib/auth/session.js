import { getIronSession } from 'iron-session'

export const sessionOptions = {
  cookieName: 'lunchbox_session',
  password: process.env.SESSION_SECRET,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  },
}

export async function getSession(req, res) {
  return getIronSession(req, res, sessionOptions)
}
