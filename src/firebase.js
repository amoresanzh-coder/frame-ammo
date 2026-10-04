// Single Firebase initialization, shared by the admin and the public site.
// Values come from .env (local) or Vercel Environment Variables.
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const env = import.meta.env
export const app = getApps()[0] || initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
export const auth = getAuth(app)
export const db = getFirestore(app)
