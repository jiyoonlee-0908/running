// src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'

// ✅ Firebase 콘솔에서 복사한 새 프로젝트 설정 (질문에 제공한 값)
const firebaseConfig = {
  apiKey: "AIzaSyAqIpeLvVI2EGABJTGsBN9BEHOKgxbXstY",
  authDomain: "running-8932a.firebaseapp.com",
  projectId: "running-8932a",
  storageBucket: "running-8932a.firebasestorage.app",
  messagingSenderId: "1086190126018",
  appId: "1:1086190126018:web:4b2dfbfeac6919d0ad4c5b",
  measurementId: "G-JET0K0ZBN3"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// (선택) 오프라인 캐시 — 실패해도 무시
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => {})
}
