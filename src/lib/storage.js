// src/lib/storage.js
import { db } from './firebase.js'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const LS_GUEST = 'rd_guest' // { name, entries }

// Firestore 경로: users/{uid}/datasets/default
const dataDoc = (uid) => doc(db, 'users', uid, 'datasets', 'default')

export async function loadEntries(uid) {
  if (!uid) {
    try {
      // 기본 name은 '' (빈 문자열)
      return JSON.parse(localStorage.getItem(LS_GUEST) || '{"name":"","entries":[]}')
    } catch {
      return { name: '', entries: [] }
    }
  }
  const snap = await getDoc(dataDoc(uid))
  if (snap.exists()) {
    const d = snap.data()
    return { name: typeof d.name === 'string' ? d.name : '', entries: Array.isArray(d.entries) ? d.entries : [] }
  }
  return { name: '', entries: [] }
}

export async function saveEntries(uid, payload) {
  if (!uid) {
    localStorage.setItem(LS_GUEST, JSON.stringify(payload))
    return
  }
  await setDoc(dataDoc(uid), payload, { merge: true })
}

// 게스트(localStorage) → 계정(Firestore)로 병합
export async function mergeGuestToUser(uid) {
  if (!uid) return { mergedCount: 0 }

  let guest = null
  try { guest = JSON.parse(localStorage.getItem(LS_GUEST) || 'null') } catch {}
  if (!guest || !Array.isArray(guest.entries) || guest.entries.length === 0) {
    return { mergedCount: 0 }
  }

  const current = await loadEntries(uid)
  const merged = [...(current.entries || []), ...guest.entries]

  // 날짜+몇 개 필드로 중복 제거
  const seen = new Set()
  const dedup = []
  for (const e of merged.sort((a,b)=>new Date(a.date)-new Date(b.date))) {
    const key = `${e.date}|${e.avgPace ?? ''}|${e.avgHR ?? ''}|${e.avgPower ?? ''}`
    if (!seen.has(key)) { seen.add(key); dedup.push(e) }
  }

  // 이름은 "게스트 이름 → 기존 계정 이름 → 빈문자열" 우선순위
  await saveEntries(uid, { name: guest.name || current.name || '', entries: dedup })
  localStorage.removeItem(LS_GUEST)
  return { mergedCount: guest.entries.length }
}

export default { loadEntries, saveEntries, mergeGuestToUser }
