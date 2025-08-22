// src/App.jsx
import React, { useEffect, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import Dashboard from './components/Dashboard.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { loadEntries, saveEntries, mergeGuestToUser } from './lib/storage.js'
import { auth, googleProvider } from './lib/firebase.js'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

import qr1 from './qr1.png'
import qr2 from './qr2.png'

const STR = {
  en: {
    brand: 'Iron Training Log',
    dashTitle: 'Visualization Dashboard',
    linksTitle: 'Links · QR',

    reset: 'Reset',
    saveGuest: 'Save as Guest (this browser)',
    saveAccount: 'Save to Account',
    login: 'Sign in with Google',
    logout: 'Log out',

    langEn: 'English',
    langKo: '한국어',
    compactEn: 'Eng',
    compactKo: '한',

    syncing: 'Syncing…',
    titleNote: 'Records are saved when you log in',

    // 저장 안내(두 줄)
    saveHint1: "After entering data, click 'Save to Account' at the end.",
    saveHint2: "If you don't save, you can’t load it next time.",

    // 섹션 제목(영문)
    titleRun: 'Running Log',
    titleSwim: 'Swimming Log',
    titleBike: 'Cycling Log',

    // 스포츠 라벨
    sports: { run: 'Running', swim: 'Swimming', bike: 'Cycling' },

    // 브라우저 탭 제목
    pageTitles: { run: 'Running Log', swim: 'Swimming Log', bike: 'Cycling Log' },

    // QR 캡션
    okcyReserve: 'OK Cycling Reservation',
    doctorParkYoutube: 'Dr. Park Cycling YouTube',
  },
  ko: {
    brand: 'Iron Training Log',
    dashTitle: '시각화 대시보드',
    linksTitle: '링크 · QR',

    reset: '초기화',
    saveGuest: '게스트로 저장(현재 브라우저)',
    saveAccount: '계정에 저장',
    login: 'Google 로그인',
    logout: '로그아웃',

    langEn: 'English',
    langKo: '한국어',
    compactEn: 'Eng',
    compactKo: '한',

    syncing: '동기화 중…',
    titleNote: '로그인하면 기록이 저장됩니다',

    // 저장 안내(두 줄)
    saveHint1: "로그인 후 데이터를 입력하시고, ‘계정에 저장’을 눌러주세요.",
    saveHint2: "저장하지 않으면 다음에 내용을 불러올 수 없습니다.",

    // 섹션 제목(국문) — “사이클” → “사이클링”
    titleRun: '러닝 기록',
    titleSwim: '수영 기록',
    titleBike: '사이클링 기록',

    // 스포츠 라벨 — “사이클” → “사이클링”
    sports: { run: '러닝', swim: '수영', bike: '사이클링' },

    // 브라우저 탭 제목
    pageTitles: { run: '러닝기록', swim: '수영기록', bike: '사이클링 기록' },

    okcyReserve: '오케이사이클링 예약하기',
    doctorParkYoutube: '사이클박박사 유튜브',
  },
}

/** 저장 데이터 정규화(과거 구조 호환) */
function normalizeData(raw) {
  const name = (raw?.name || '').trim()
  if (raw?.entriesBySport) {
    const e = raw.entriesBySport
    return {
      name,
      entriesBySport: {
        run: Array.isArray(e.run) ? e.run : [],
        swim: Array.isArray(e.swim) ? e.swim : [],
        bike: Array.isArray(e.bike) ? e.bike : [],
      },
    }
  }
  return {
    name,
    entriesBySport: {
      run: Array.isArray(raw?.entries) ? raw.entries : [],
      swim: [],
      bike: [],
    },
  }
}

export default function App() {
  // URL 경로가 /910908인지 확인
  const isAdminRoute = window.location.pathname === '/910908'
  
  // 관리자 페이지라면 AdminPanel 컴포넌트 렌더링
  if (isAdminRoute) {
    return <AdminPanel />
  }

  const [user, setUser] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('rg_lang') || 'ko')
  const T = STR[lang]

  // 현재 종목
  const [sport, setSport] = useState('run') // 'run' | 'swim' | 'bike'
  // PC 드로어
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 데이터(종목별)
  const [name, setName] = useState('')
  const [entriesBySport, setEntriesBySport] = useState({ run: [], swim: [], bike: [] })

  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState(null)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => { localStorage.setItem('rg_lang', lang) }, [lang])

  // 게스트 데이터 로드
  useEffect(() => {
    (async () => {
      const data = await loadEntries(null)
      const norm = normalizeData(data || {})
      setName(norm.name || '')
      setEntriesBySport(norm.entriesBySport)
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
            mergeGuestToUser(u.uid).catch(() => ({ mergedCount: 0 })),
          ])
          const serverNorm = normalizeData(serverData || {})
          const fallback = u.displayName || (u.email ? u.email.split('@')[0] : '')
          setName(serverNorm.name || fallback || '')
          setEntriesBySport(serverNorm.entriesBySport)

          if (mergeRes?.mergedCount > 0) {
            const after = normalizeData(await loadEntries(u.uid))
            setEntriesBySport(after.entriesBySport)
          }
        } finally {
          setSyncing(false)
        }
      } else {
        const data = await loadEntries(null)
        const norm = normalizeData(data || {})
        setName(norm.name || '')
        setEntriesBySport(norm.entriesBySport)
        setSyncing(false)
      }
    })
    return () => unsub()
  }, [])

  // 맨 위로 버튼
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

  // 브라우저 탭 제목: 스포츠/언어에 따라 변경
  useEffect(() => {
    const titles = STR[lang].pageTitles
    const title = titles[sport] || 'Iron Training Log'
    document.title = title
  }, [lang, sport])

  const doAuth = async () => { await signInWithPopup(auth, googleProvider) }
  const doLogout = async () => { await signOut(auth) }

  // App.jsx 안의 handleSave 교체
const handleSave = async () => {
  const uid = user?.uid || null
  if (!uid) {
    setToast(lang === 'ko' ? '로그인 후 저장할 수 있어요.' : 'Sign in to save.')
    return
  }
  await saveEntries(uid, {
    name: name || user.displayName || (user.email ? user.email.split('@')[0] : ''),
    ownerUid: uid,
    email: user.email || '',
    displayName: user.displayName || '',
    entries: entriesBySport.run,   // 레거시 호환
    entriesBySport,
  })
  setToast(lang === 'ko' ? '계정에 저장되었습니다!' : 'Saved to your account!')
  clearTimeout(handleSave._t)
  handleSave._t = setTimeout(() => setToast(null), 2200)
}


  // 현재 종목 데이터 바인딩
  const currentEntries = entriesBySport[sport] || []
  const setCurrentEntries = (arr) =>
    setEntriesBySport(prev => ({ ...prev, [sport]: arr }))

  // 섹션 제목
  const sectionTitle = ({ run: T.titleRun, swim: T.titleSwim, bike: T.titleBike })[sport]

  // ===== PC용 스포츠 탭(드로어 안에서 사용)
  const SportTabs = ({ size = 'md', onAfterClick }) => (
    <div className={`sport-tabs ${size}`}>
      {['run','swim','bike'].map(key => (
        <button
          key={key}
          className={`sport-tab ${sport === key ? 'active' : ''}`}
          onClick={() => { setSport(key); setDrawerOpen(false); onAfterClick && onAfterClick() }}
        >
          {STR[lang].sports[key]}
        </button>
      ))}
    </div>
  )

  // QR 두 개(한 줄)
  const QRRow = () => {
    const row = { display:'flex', gap:16, marginTop:4, marginBottom:4, alignItems:'flex-start', justifyContent:'space-between', flexWrap:'nowrap' }
    const col = { flex:'0 0 calc(50% - 8px)', textAlign:'center' }
    const aStyle = { display:'block', textDecoration:'none', color:'#111827' }
    const box = { width:'min(380px, 100%)', aspectRatio:'1 / 1', margin:'0 auto 8px', position:'relative', background:'transparent' }
    const inner = (scale=1)=>({ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', transform:`scale(${scale})`, transformOrigin:'center', padding:0 })
    const imgStyle = { width:'100%', height:'100%', objectFit:'contain', borderRadius:8, display:'block' }
    const caption = { fontSize:14, fontWeight:600 }
    return (
      <div style={row}>
        <div style={col}>
          <a href="https://m.site.naver.com/1O9lV" target="_blank" rel="noopener noreferrer" style={aStyle}>
            <div style={box}><div style={inner(1.03)}><img src={qr1} alt="OK Cycling QR" style={imgStyle}/></div></div>
            <div style={caption}>{T.okcyReserve}</div>
          </a>
        </div>
        <div style={col}>
          <a href="https://www.youtube.com/@cyclinglab" target="_blank" rel="noopener noreferrer" style={aStyle}>
            <div style={box}><div style={inner(0.96)}><img src={qr2} alt="사이클박박사 유튜브 QR" style={imgStyle}/></div></div>
            <div style={caption}>{T.doctorParkYoutube}</div>
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* ===================== HEADER ===================== */}
      <div className="header">
        <div className="nav">
          {/* 햄버거(PC에서만 보임) */}
          <button
            className="hamburger only-desktop"
            aria-label="menu"
            onClick={() => setDrawerOpen(v => !v)}
          >
            <span className="hamburger-icon" />
          </button>

          <div className="brand-wrap">
            <span className="brand">{T.brand}</span>
            {/* 현재 종목 칩(PC 전용) */}
            <span className="sport-chip only-desktop">{STR[lang].sports[sport]}</span>
          </div>

          {/* 언어: PC는 English/한국어, 모바일은 Eng/한 */}
          <div className="lang-wrap">
            <button
              className={`lang-toggle ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              title="English"
            >
              <span className="only-desktop">{T.langEn}</span>
              <span className="only-mobile">{T.compactEn}</span>
            </button>
            <span className="sep">|</span>
            <button
              className={`lang-toggle ${lang === 'ko' ? 'active' : ''}`}
              onClick={() => setLang('ko')}
              title="한국어"
            >
              <span className="only-desktop">{T.langKo}</span>
              <span className="only-mobile">{T.compactKo}</span>
            </button>
          </div>

          <div className="user-cta">
            {syncing && <span className="help">{T.syncing}</span>}
            {user ? (
              <>
                <span className="help user-email">{user.email}</span>
                <button className="button" onClick={doLogout}>{T.logout}</button>
              </>
            ) : (
              <button className="button primary" onClick={doAuth}>
                {T.login}
              </button>
            )}
          </div>
        </div>

        {/* PC 드로어 */}
        <div className={`top-drawer only-desktop ${drawerOpen ? 'show' : ''}`}>
          <div className="drawer-tabs">
            <SportTabs size="md" onAfterClick={() => setDrawerOpen(false)} />
          </div>
        </div>
      </div>

      {/* ===== 헤더 바로 아래 크레딧 ===== */}
      <div className="credit-under-header">
        <strong>오케이사이클링 박주혁프로</strong> 제작
      </div>

      {/* ===================== MAIN ===================== */}
      <div className="container" style={{ paddingTop: 8 }}>
        <div className="two-pane">
          {/* LEFT */}
          <div>
            <div className="card">
              <h3 className="section-title">
                {sectionTitle}
                <span className="title-note">({T.titleNote})</span>
              </h3>

              <EntryForm
                entries={currentEntries}
                setEntries={setCurrentEntries}
                lang={lang}
                sport={sport}
              />

              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button className="button" onClick={() => setCurrentEntries([])}>
                    {T.reset}
                  </button>
                  <button className="button primary" onClick={handleSave}>
                    {user ? T.saveAccount : T.saveGuest}
                  </button>
                </div>

                {/* ⬇️ 저장 안내(두 줄) — T에서 직접 읽어와 항상 보이도록 */}
                <div className="save-hint" style={{ marginTop: 18 }}>
                  {T.saveHint1}<br />{T.saveHint2}
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="card" style={{ marginTop: 16 }}>
              <h3 className="section-title">{T.linksTitle}</h3>
              <QRRow />
            </div>
          </div>

          {/* RIGHT */}
          <div className="card">
            <h3 className="section-title">{T.dashTitle}</h3>
            <Dashboard name={name} entries={currentEntries} lang={lang} sport={sport} />
          </div>
        </div>
      </div>

      {/* ===== 모바일 하단 고정 탭 ===== */}
      <div className="bottom-nav only-mobile">
        {['run','swim','bike'].map(key => (
          <button
            key={key}
            className={`bn-item ${sport === key ? 'active' : ''}`}
            onClick={() => setSport(key)}
            aria-current={sport === key ? 'page' : undefined}
          >
            {STR[lang].sports[key]}
          </button>
        ))}
      </div>

      {/* Top 버튼 */}
      <button
        className={`fab-top ${showTop ? 'show' : ''}`}
        onClick={scrollTop}
        aria-label={lang === 'en' ? 'Back to top' : '맨 위로'}
      >
        ↑ Top
      </button>

      {/* 토스트 */}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
