// src/App.jsx
import React, { useEffect, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import Dashboard from './components/Dashboard.jsx'
import { loadEntries, saveEntries, mergeGuestToUser } from './lib/storage.js'
import { auth, googleProvider } from './lib/firebase.js'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

const STR = {
  en: {
    formTitle: 'Input · Save',
    dashTitle: 'Visualization Dashboard',
    reset: 'Reset',
    saveGuest: 'Save as Guest (this browser)',
    saveAccount: 'Save to Account',
    login: 'Sign in with Google',
    logout: 'Log out',
    langEn: 'English',
    langKo: '한국어',
    notice: 'Your records are saved when you log in. Made by Pro Juhyeok Park, OK Cycling.',
    syncing: 'Syncing…',
    toastGuestSaved: 'Saved locally (this browser).',
    toastAccountSaved: 'Saved to your account!',
    backToTop: 'Top'
  },
  ko: {
    formTitle: '기록 입력 · 저장',
    dashTitle: '시각화 대시보드',
    reset: '초기화',
    saveGuest: '게스트로 저장(이 브라우저)',
    saveAccount: '계정에 저장',
    login: 'Google로 로그인',
    logout: '로그아웃',
    langEn: 'English',
    langKo: '한국어',
    notice: '로그인을 하면 기록이 저장됩니다. 오케이사이클링 박주혁프로가 제작했습니다.',
    syncing: '동기화 중…',
    toastGuestSaved: '이 브라우저에 저장되었습니다.',
    toastAccountSaved: '계정에 저장되었습니다!',
    backToTop: '맨위'
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('rg_lang') || 'ko')
  const T = STR[lang]

  const [name, setName] = useState('')
  const [entries, setEntries] = useState([])

  // 상단 작은 인디케이터(전체 블로킹 X)
  const [syncing, setSyncing] = useState(false)
  // 저장 성공 토스트
  const [toast, setToast] = useState(null)
  // 맨 위로 버튼 표시 여부
  const [showTop, setShowTop] = useState(false)

  // 토스트 헬퍼
  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(null), 2200)
  }

  // 언어 저장
  useEffect(() => { localStorage.setItem('rg_lang', lang) }, [lang])

  // 초기엔 게스트 데이터 먼저 그려서 첫 페인트 빠르게
  useEffect(() => {
    (async () => {
      const data = await loadEntries(null)
      setName(data.name || '')
      setEntries(data.entries || [])
    })()
  }, [])

  // 인증 상태 구독 (언어 전환과 무관하게 한 번만)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null)
      if (u) {
        setSyncing(true)
        try {
          // 서버 데이터 로드 + 게스트 병합(에러 무시) 병렬
          const [serverData, mergeRes] = await Promise.all([
            loadEntries(u.uid),
            mergeGuestToUser(u.uid).catch(() => ({ mergedCount: 0 }))
          ])

          const fallback = u.displayName || (u.email ? u.email.split('@')[0] : '')
          setName((serverData.name && serverData.name.trim()) ? serverData.name : fallback)
          setEntries(serverData.entries || [])

          // 병합이 있었다면 새 데이터로 갱신
          if (mergeRes?.mergedCount > 0) {
            const after = await loadEntries(u.uid)
            setEntries(after.entries || [])
            showToast(lang==='en' ? `Merged ${mergeRes.mergedCount} items.` : `${mergeRes.mergedCount}건 병합됨`)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setSyncing(false)
        }
      } else {
        // 게스트 모드
        const data = await loadEntries(null)
        setName(data.name || '')
        setEntries(data.entries || [])
        setSyncing(false)
      }
    })
    return () => unsub()
  }, []) // 의도적으로 deps 없음

  // "맨 위로" 버튼 표시 제어
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // 동기화 무한 표시 방지용 안전 타임아웃(15초)
  useEffect(() => {
    if (!syncing) return
    const t = setTimeout(() => setSyncing(false), 15000)
    return () => clearTimeout(t)
  }, [syncing])

  // Google 인증: 가입/로그인 통합 (계정 없으면 자동 생성)
  const doAuth = async () => {
    try { await signInWithPopup(auth, googleProvider) } catch (e) { alert(e?.message || e) }
  }
  const doLogout = async () => { await signOut(auth) }

  const handleSave = async () => {
    const uid = user?.uid || null
    try {
      await saveEntries(uid, { name: name || '', entries })
      showToast(uid ? T.toastAccountSaved : T.toastGuestSaved)
    } catch (e) {
      alert(e?.message || e)
    }
  }

  return (
    <>
      {/* NAV */}
      <div className="header">
        <div className="nav">
          <div className="brand-wrap">
            <span className="brand">Running Growth</span>
            <span className="brand-sub">러닝기록</span>
          </div>

          <div className="nav-right">
            {syncing && <span className="help">{T.syncing}</span>}

            <button
              className={`lang-toggle ${lang==='en' ? 'active' : ''}`}
              onClick={()=>setLang('en')}
              title="English"
            >{T.langEn}</button>
            <span style={{color:'#cbd5e1'}}>|</span>
            <button
              className={`lang-toggle ${lang==='ko' ? 'active' : ''}`}
              onClick={()=>setLang('ko')}
              title="Korean"
            >{T.langKo}</button>

            {!user ? (
              // ✅ 단일 버튼: 가입/로그인 통합
              <button className="button primary" onClick={doAuth}>
                {T.login}
              </button>
            ) : (
              <>
                <span className="help">{user.email}</span>
                <button className="button" onClick={doLogout}>{T.logout}</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="container">
        <div className="notice">{T.notice}</div>
      </div>

      {/* 본문: 항상 1:1 레이아웃 */}
      <div className="container" style={{ paddingTop: 8 }}>
        <div className="two-pane">
          {/* LEFT */}
          <div className="card">
            <h3 className="section-title">{T.formTitle}</h3>
            <EntryForm
              name={name}
              setName={setName}
              entries={entries}
              setEntries={setEntries}
              lang={lang}
            />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
              <button className="button" onClick={()=>setEntries([])}>{T.reset}</button>
              <button className="button primary" onClick={handleSave}>
                {user ? T.saveAccount : T.saveGuest}
              </button>
            </div>
          </div>

          {/* RIGHT */}
          <div className="card">
            <h3 className="section-title">{T.dashTitle}</h3>
            <Dashboard name={name} entries={entries} lang={lang} />
          </div>
        </div>
      </div>

      {/* 맨 위로 버튼 */}
      <button
        className={`fab-top ${showTop ? 'show' : ''}`}
        onClick={scrollTop}
        aria-label={lang==='en' ? 'Back to top' : '맨 위로'}
      >
        ↑ {T.backToTop}
      </button>

      {/* 저장 토스트 */}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
