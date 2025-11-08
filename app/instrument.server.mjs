import * as Sentry from '@sentry/tanstackstart-react'

let dsn = process.env.SENTRY_DSN ?? process.env.VITE_SENTRY_DSN

if (!dsn && typeof import.meta !== 'undefined' && import.meta.env) {
  dsn = import.meta.env.VITE_SENTRY_DSN
}

if (dsn) {
  Sentry.init({
    dsn,
    sendDefaultPii: true,
  })
}
