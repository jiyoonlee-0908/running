// src/App.jsx
import React, { useEffect, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import Dashboard from './components/Dashboard.jsx'
import { loadEntries, saveEntries, mergeGuestToUser } from './lib/storage.js'
import { auth, googleProvider } from './lib/firebase.js'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

// QR 이미지
import qr1 from './qr1.png'
import qr2 from './qr2.png'

const STR = {
  en: {
    formTitle: 'Input · Save',
    dashTitle: 'Visualization Dashboard',
    linksTitle: 'Links · QR',

    reset: 'Reset',
    saveGuest: 'Save as Guest (this browser)',
    saveAccount: 'Save to Account',
    login: 'Sign in with Google',
    logout: 'Log out',
    langEn: 'English',
    langKo: '한국어',
    syncing: 'Syncing…',

    // 저장 안내(두 줄)
    saveHint1: "After entering data, click 'Save to Account' at the end.",
    saveHint2: "If you don't save, you can’t load it next time.",

    // 폼 제목 옆 안내
    titleNote: 'Records are saved when you log in',

    // 제작 크레딧 (오른쪽 정렬로 표기)
    creditLead: 'Built by ',
    creditName: 'Juhyuk Park, OK Cycling',

    okcyReserve: 'OK Cycling Reservation',
    doctorParkYoutube: 'Dr. Park Cycling YouTube',
  },
  ko: {
    formTitle: '기록 입력 · 저장',
    dashTitle: '시각화 대시보드',
    linksTitle: '링크 · QR',

    reset: '초기화',
    saveGuest: '게스트로 저장(현재 브라우저)',
    saveAccount: '계정에 저장',
    login: 'Google 로그인',
    logout: '로그아웃',
    langEn: 'English',
    langKo: '한국어',
    syncing: '동기화 중…',

    // 저장 안내(두 줄)
    saveHint1: "로그인 후 데이터를 입력하시고, ‘계정에 저장’을 눌러주세요.",
    saveHint2: "저장하지 않으면 다음에 내용을 불러올 수 없습니다.",

    // 폼 제목 옆 안내
    titleNote: '로그인하면 기록이 저장됩니다',

    // 제작 크레딧 (오른쪽 정렬로 표기)
    creditLead: '',
    creditName: '오케이사이클링 박주혁프로',
    creditTail: ' 제작',

    okcyReserve: '오케이사이클링 예약하기',
    doctorParkYoutube: '사이클박박사 유튜브',
  },
}

export default function App() {
  const [user, setUser] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('rg_lang') || 'ko')
  const T = STR[lang]

  const [name, setName] = useState('')
  const [entries, setEntries] = useState([])

  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)
  const [showTop, setShowTop] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => { localStorage.setItem('rg_lang', lang) }, [lang])

  // 게스트 데이터 초기 로드
  useEffect(() => {
    (async () => {
      const data = await loadEntries(null)
      setName(data.name || '')
      setEntries(data.entries || [])
    })()
  }, [])

  // 인증 상태
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null)
      if (u) {
        setSyncing(true)
        try {
          const [serverData, mergeRes] = await Promise.all([
            loadEntries(u.uid),
            mergeGuestToUser(u.uid).catch(() => ({ mergedCount: 0 }))
          ])
          const fallback = u.displayName || (u.email ? u.email.split('@')[0] : '')
          setName((serverData.name && serverData.name.trim()) ? serverData.name : fallback)
          setEntries(serverData.entries || [])
          if (mergeRes?.mergedCount > 0) {
            const after = await loadEntries(u.uid)
            setEntries(after.entries || [])
          }
        } finally {
          setSyncing(false)
        }
      } else {
        const data = await loadEntries(null)
        setName(data.name || '')
        setEntries(data.entries || [])
        setSyncing(false)
      }
    })
    return () => unsub()
  }, [])

  // 맨 위로 버튼 가시성
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // 동기화 안전 타임아웃
  useEffect(() => {
    if (!syncing) return
    const t = setTimeout(() => setSyncing(false), 15000)
    return () => clearTimeout(t)
  }, [syncing])

  const doAuth   = async () => { await signInWithPopup(auth, googleProvider) }
  const doLogout = async () => { await signOut(auth) }

  const handleSave = async () => {
    const uid = user?.uid || null
    await saveEntries(uid, { name: name || '', entries })
    showToast(
      uid
        ? (lang === 'ko' ? '계정에 저장되었습니다!' : 'Saved to your account!')
        : (lang === 'ko' ? '이 브라우저에 저장되었습니다.' : 'Saved locally.')
    )
  }

  // QR 두 개(한 줄)
  const QRRow = () => {
    const row = { display:'flex', gap:16, marginTop:4, marginBottom:4, alignItems:'flex-start', justifyContent:'space-between', flexWrap:'nowrap' }
    const col = { flex:'0 0 calc(50% - 8px)', textAlign:'center' }
    const aStyle = { display:'block', textDecoration:'none', color:'#111827' }
    const box = { width:'min(380px, 100%)', aspectRatio:'1 / 1', margin:'0 auto 8px', position:'relative', background:'transparent' }
    const inner = (scale=1)=>({ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', transform:`scale(${scale})`, transformOrigin:'center', padding:0 })
    const imgStyle = { width:'100%', height:'100%', objectFit:'contain', borderRadius:8, display:'block' }
    const caption = { fontSize:14, fontWeight:600 }
    const SCALE_QR1 = 1.03, SCALE_QR2 = 0.96

    return (
      <div style={row}>
        <div style={col}>
          <a href="https://m.site.naver.com/1O9lV" target="_blank" rel="noopener noreferrer" style={aStyle}>
            <div style={box}><div style={inner(SCALE_QR1)}><img src={qr1} alt="OK Cycling QR" style={imgStyle}/></div></div>
            <div style={caption}>{T.okcyReserve}</div>
          </a>
        </div>
        <div style={col}>
          <a href="https://www.youtube.com/@cyclinglab" target="_blank" rel="noopener noreferrer" style={aStyle}>
            <div style={box}><div style={inner(SCALE_QR2)}><img src={qr2} alt="사이클박박사 유튜브 QR" style={imgStyle}/></div></div>
            <div style={caption}>{T.doctorParkYoutube}</div>
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ===================== NAV ===================== */}
      <div className="header">
        {/* PC: 브랜드 왼쪽, 언어 ▸ 로그인 오른쪽 */}
        {/* 모바일: 한 줄(브랜드 · Eng/한 · Google 로그인) */}
        <div className="nav">
          <div className="brand-wrap">
            <span className="brand">Iron Training Log</span>
          </div>

          <div className="lang-wrap">
            <button
              className={`lang-toggle ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              title="English"
            >
              <span className="only-desktop">{STR.en.langEn}</span>
              <span className="only-mobile">Eng</span>
            </button>
            <span className="sep">|</span>
            <button
              className={`lang-toggle ${lang === 'ko' ? 'active' : ''}`}
              onClick={() => setLang('ko')}
              title="한국어"
            >
              <span className="only-desktop">{STR.ko.langKo}</span>
              <span className="only-mobile">한</span>
            </button>
          </div>

          <div className="user-cta">
            {syncing && <span className="help">{STR[lang].syncing}</span>}
            {user ? (
              <>
                <span className="help user-email">{user.email}</span>
                <button className="button" onClick={doLogout}>{STR[lang].logout}</button>
              </>
            ) : (
              <button className="button primary" onClick={doAuth}>
                <span>Google</span><span style={{ marginLeft: 4 }}>{lang === 'ko' ? '로그인' : 'Sign in'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===================== 제작 크레딧(오른쪽 정렬) ===================== */}
      <div className="container">
        <div className="notice">
          {lang === 'ko' ? (
            <>
              {STR.ko.creditLead}
              <strong>{STR.ko.creditName}</strong>
              {STR.ko.creditTail}
            </>
          ) : (
            <>
              {STR.en.creditLead}
              <strong>{STR.en.creditName}</strong>
            </>
          )}
        </div>
      </div>

      {/* ===================== 본문 ===================== */}
      <div className="container" style={{ paddingTop: 8 }}>
        <div className="two-pane">
          {/* LEFT */}
          <div>
            <div className="card">
              {/* 제목 + 작은 안내 */}
              <h3 className="section-title">
                {T.formTitle}
                <span className="title-note">({STR[lang].titleNote})</span>
              </h3>

              <EntryForm
                name={name}
                setName={setName}
                entries={entries}
                setEntries={setEntries}
                lang={lang}
              />

              {/* 버튼 + 저장 안내 */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="button" onClick={() => setEntries([])}>
                    {T.reset}
                  </button>
                  <button className="button primary" onClick={handleSave}>
                    {user ? T.saveAccount : T.saveGuest}
                  </button>
                </div>

                {/* 저장 안내(두 줄) */}
                <div className="save-hint" style={{ marginTop: 18 }}>
                  {T.saveHint1}<br />{T.saveHint2}
                </div>
              </div>
            </div>

            {/* QR 카드 */}
            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="section-title">{T.linksTitle}</h3>
              <QRRow />
            </div>
          </div>

          {/* RIGHT */}
          <div className="card">
            <h3 className="section-title">{T.dashTitle}</h3>
            <Dashboard name={name} entries={entries} lang={lang} />
          </div>
        </div>
      </div>

      {/* 맨 위로 버튼(데스크톱 위주) */}
      <button
        className={`fab-top ${showTop ? 'show' : ''}`}
        onClick={scrollTop}
        aria-label={lang === 'en' ? 'Back to top' : '맨 위로'}
      >
        ↑ Top
      </button>

      {/* 저장 토스트 */}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
