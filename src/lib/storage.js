// src/lib/storage.js
import { db } from './firebase.js'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const LS_KEY = 'rd_guest'
const LS_NAME = 'rd_name'

/**
 * 게스트(로컬) 또는 사용자(Firestore)에서 데이터 로드
 * - 레거시 구조({ entries })도 그대로 반환합니다. (App.jsx에서 normalizeData로 정규화)
 */
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

/**
 * 데이터 저장
 * - uid 없으면 로컬스토리지
 * - uid 있으면 Firestore
 * - updatedAt 서버시간 기록
 */
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

/**
 * 게스트(로컬) 데이터 → 사용자(Firestore) 데이터로 병합
 * - 레거시 entries(=run) 배열도 병합 유지
 * - entriesBySport(run/swim/bike) 각 종목별로 중복 없이 병합
 * - 병합 후 로컬 게스트 데이터 삭제
 */
export async function mergeGuestToUser(uid) {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return { mergedCount: 0 }

  let guest
  try {
    guest = JSON.parse(raw)
  } catch {
    return { mergedCount: 0 }
  }

  const ref = doc(db, 'users', uid, 'datasets', 'default')
  const snap = await getDoc(ref)
  const current = snap.exists()
    ? (snap.data() || { name: '', entries: [], entriesBySport: { run: [], swim: [], bike: [] } })
    : { name: '', entries: [], entriesBySport: { run: [], swim: [], bike: [] } }

  // ---------- 1) 레거시(entries) 병합 (예전 러닝 배열 호환)
  const existingLegacy = new Set((current.entries || []).map(e =>
    `${e.date}|${e.avgPace ?? ''}|${e.maxPace ?? ''}|${e.avgHR ?? ''}|${e.maxHR ?? ''}`
  ))
  const mergedLegacy = [...(current.entries || [])]
  let mergedCount = 0

  for (const e of (guest.entries || [])) {
    const key = `${e.date}|${e.avgPace ?? ''}|${e.maxPace ?? ''}|${e.avgHR ?? ''}|${e.maxHR ?? ''}`
    if (!existingLegacy.has(key)) {
      mergedLegacy.push(e)
      mergedCount++
    }
  }
  mergedLegacy.sort((a, b) => new Date(a.date) - new Date(b.date))

  // ---------- 2) 신규(entriesBySport) 병합 (run / swim / bike 각각)
  const sports = ['run', 'swim', 'bike']
  const curBy = current.entriesBySport || { run: [], swim: [], bike: [] }
  const gstBy = guest.entriesBySport || { run: [], swim: [], bike: [] }
  const mergedBy = {}

  for (const s of sports) {
    const cur = Array.isArray(curBy[s]) ? curBy[s] : []
    const gst = Array.isArray(gstBy[s]) ? gstBy[s] : []

    // 엔트리 특성상 날짜 + 주요 메트릭으로 시그니처 구성
    const sig = (x) =>
      `${x.date}|${x.dist ?? ''}|${x.avgPace ?? ''}|${x.maxPace ?? ''}|${x.avgHR ?? ''}|${x.maxHR ?? ''}|${x.avgPower ?? ''}|${x.maxPower ?? ''}|${x.avgCad ?? ''}|${x.maxCad ?? ''}|${x.stride ?? ''}|${x.gct ?? ''}|${x.vRatio ?? ''}|${x.vOsc ?? ''}`

    const set = new Set(cur.map(sig))
    const merged = [...cur]

    for (const e of gst) {
      const k = sig(e)
      if (!set.has(k)) {
        merged.push(e)
        mergedCount++
      }
    }
    merged.sort((a, b) => new Date(a.date) - new Date(b.date))
    mergedBy[s] = merged
  }

  await setDoc(
    ref,
    {
      name: current.name || guest.name || '',
      entries: mergedLegacy,      // 레거시 유지
      entriesBySport: mergedBy,   // 종목별 병합 결과
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  // 병합 성공 시 게스트 데이터 제거
  localStorage.removeItem(LS_KEY)
  return { mergedCount }
}
