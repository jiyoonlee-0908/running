// src/lib/storage.js
import { db } from './firebase.js'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const LS_KEY = 'rd_guest'
const LS_NAME = 'rd_name'

export async function loadEntries(uid) {
  if (!uid) {
    try {
      const j = localStorage.getItem(LS_KEY)
      const name = localStorage.getItem(LS_NAME) || ''
      return j ? JSON.parse(j) : { name, entries: [] }
    } catch {
      return { name: '', entries: [] }
    }
  }
  const ref = doc(db, 'users', uid, 'datasets', 'default')
  const snap = await getDoc(ref)
  return snap.exists() ? (snap.data() || { name: '', entries: [] }) : { name: '', entries: [] }
}

export async function saveEntries(uid, payload) {
  if (!uid) {
    localStorage.setItem(LS_NAME, payload.name || '')
    localStorage.setItem(LS_KEY, JSON.stringify(payload))
    return { local: true }
  }
  const ref = doc(db, 'users', uid, 'datasets', 'default')
  await setDoc(
    ref,
    { ...payload, updatedAt: serverTimestamp() },
    { merge: true }
  )
  return { local: false }
}

export async function mergeGuestToUser(uid) {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return { mergedCount: 0 }
  let guest; try { guest = JSON.parse(raw) } catch { return { mergedCount: 0 } }

  const ref = doc(db, 'users', uid, 'datasets', 'default')
  const snap = await getDoc(ref)
  const current = snap.exists() ? (snap.data() || { name: '', entries: [] }) : { name: '', entries: [] }

  const existing = new Set((current.entries || []).map(e =>
    `${e.date}|${e.avgPace ?? ''}|${e.maxPace ?? ''}|${e.avgHR ?? ''}|${e.maxHR ?? ''}`
  ))

  const merged = [...(current.entries || [])]
  let mergedCount = 0
  for (const e of (guest.entries || [])) {
    const key = `${e.date}|${e.avgPace ?? ''}|${e.maxPace ?? ''}|${e.avgHR ?? ''}|${e.maxHR ?? ''}`
    if (!existing.has(key)) { merged.push(e); mergedCount++ }
  }
  merged.sort((a,b)=>new Date(a.date)-new Date(b.date))

  await setDoc(ref, {
    name: current.name || guest.name || '',
    entries: merged,
    updatedAt: serverTimestamp()
  }, { merge: true })

  localStorage.removeItem(LS_KEY)
  return { mergedCount }
}
