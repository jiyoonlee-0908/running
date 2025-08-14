// src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'

// ✅ 당신이 보낸 설정값 그대로 사용
const firebaseConfig = {
  apiKey: "AIzaSyCwJGIMMhtg1LL9d8W07uAAqTklbO2ugQo",
  authDomain: "oz-firebase-c42ab.firebaseapp.com",
  projectId: "oz-firebase-c42ab",
  storageBucket: "oz-firebase-c42ab.firebasestorage.app",
  messagingSenderId: "195506676346",
  appId: "1:195506676346:web:74dd6c22928dedb5d591c3",
  measurementId: "G-YNCGY042CM"
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

// (선택) Analytics: HTTPS·브라우저 환경에서만 동작하도록 가드
let analytics = null
try {
  if (typeof window !== 'undefined') {
    isSupported().then(s => { if (s) analytics = getAnalytics(firebaseApp) })
  }
} catch {}
export { analytics }
