// src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

/** ✅ 당신 프로젝트(Web App) 설정 */
const firebaseConfig = {
  apiKey: 'AIzaSyCwJGIMMhtg1LL9d8W07uAAqTklbO2ugQo',
  authDomain: 'oz-firebase-c42ab.firebaseapp.com',
  projectId: 'oz-firebase-c42ab',
  storageBucket: 'oz-firebase-c42ab.firebasestorage.app',
  messagingSenderId: '195506676346',
  appId: '1:195506676346:web:74dd6c22928dedb5d591c3',
  measurementId: 'G-YNCGY042CM'
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

/** 오프라인 캐시(재방문/재로그인 속도 개선) */
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => {})
}
