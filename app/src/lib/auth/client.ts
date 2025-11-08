import { createAuthClient } from 'better-auth/client'
import { anonymousClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === 'production' ? '/api/auth' : '/api/auth',
  plugins: [anonymousClient],
})

export const {
  useSession,
  signIn,
  signUp,
  signOut,
  forgetPassword,
  resetPassword,
  linkSocial,
  unlinkSocial,
  changeEmail,
  changePassword,
  listSessions,
  revokeSession,
  revokeOtherSessions,
} = authClient

export const { createAnonymousSession, linkAnonymousSession } = authClient.anonymous
