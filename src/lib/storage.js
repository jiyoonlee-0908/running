// src/lib/storage.js  (Firestore에 사용자별 데이터 저장/로드)
import { db } from './firebase.js'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// 데이터 문서 경로: users/{uid}/datasets/default
const dataDoc = (uid) => doc(db, 'users', uid, 'datasets', 'default')

export async function loadEntries(uid) {
  const snap = await getDoc(dataDoc(uid))
  if (snap.exists()) {
    const data = snap.data()
    return {
      name: typeof data.name === 'string' ? data.name : '박 주혁',
      entries: Array.isArray(data.entries) ? data.entries : []
    }
  }
  return { name: '박 주혁', entries: [] }
}

export async function saveEntries(uid, payload) {
  await setDoc(dataDoc(uid), payload, { merge: true })
}
