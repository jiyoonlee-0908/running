// src/App.jsx
import React, { useEffect, useState } from 'react'
import EntryForm from './components/EntryForm.jsx'
import Dashboard from './components/Dashboard.jsx'
import { loadEntries, saveEntries, mergeGuestToUser } from './lib/storage.js'
import { auth, googleProvider } from './lib/firebase.js'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

// QR 이미지 (src 폴더에 qr1.png, qr2.png가 있어야 합니다)
import qr1 from './qr1.png'
import qr2 from './qr2.png'

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
    syncing: 'Syncing…',
    toastGuestSaved: 'Saved locally.',
    toastAccountSaved: 'Saved to your account!',
    linksTitle: 'Links · QR',
    okcyReserve: 'OK Cycling Reservation',
    doctorParkYoutube: 'Dr. Park Cycling YouTube',
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
    syncing: '동기화 중…',
    toastGuestSaved: '이 브라우저에 저장되었습니다.',
    toastAccountSaved: '계정에 저장되었습니다!',
    linksTitle: '링크 · QR',
    okcyReserve: '오케이사이클링 예약하기',
    doctorParkYoutube: '사이클박박사 유튜브',
  }
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

  // 초기 게스트 데이터
  useEffect(() => {
    ;(async () => {
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

  // 맨위 버튼 표시
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

  // Google: 가입/로그인 통합
  const doAuth = async () => { await signInWithPopup(auth, googleProvider) }
  const doLogout = async () => { await signOut(auth) }

  const handleSave = async () => {
    const uid = user?.uid || null
    await saveEntries(uid, { name: name || '', entries })
    showToast(uid ? T.toastAccountSaved : T.toastGuestSaved)
  }

  // 상단 안내문 (14px, 오른쪽 정렬, '오케이사이클링 박주혁프로'만 진하게)
  const Notice = () => (
    <div
      className="notice"
      style={{ textAlign: 'right', fontSize: '14px', color: '#64748b' }}
    >
      {lang === 'ko' ? (
        <>
          로그인하면 기록이 저장됩니다.&nbsp;
          <strong style={{ color: '#111827' }}>오케이사이클링 박주혁프로</strong>
          가 제작했습니다.
        </>
      ) : (
        <>
          Your records are saved when you log in.&nbsp;
          <strong style={{ color: '#111827' }}>Pro Juhyeok Park (OK Cycling)</strong>
          &nbsp;made this.
        </>
      )}
    </div>
  )

  // QR 두 개(한 줄), 밑줄 제거/검은색, 동일 크기/잘림 방지
  const QRRow = () => {
  const row = {
    display: 'flex',
    gap: 16,
    marginTop: 4,
    marginBottom: 4,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'nowrap', // 한 줄 고정
  };
  const col = {
    flex: '0 0 calc(50% - 8px)',
    textAlign: 'center',
  };
  const aStyle = {
    display: 'block',
    textDecoration: 'none', // 밑줄 제거
    color: '#111827',       // 검정 텍스트
  };

  // ✅ 겉 박스(두 QR의 바깥 크기를 동일하게 고정)
  const box = {
    width: 'min(380px, 100%)', // 전체 크기 조절은 여기서; 360~420 사이로 조절해도 OK
    aspectRatio: '1 / 1',
    margin: '0 auto 8px',
    position: 'relative',
    background: 'transparent',
  };

  // 내부 래퍼: 이미지 스케일 미세 조정용
  const inner = (scale = 1) => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: `scale(${scale})`,
    transformOrigin: 'center',
    padding: 0, // 필요시 8~12px 패딩 추가 가능
  });

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain', // 잘림 방지
    borderRadius: 8,
    display: 'block',
  };

  const caption = { fontSize: 14, fontWeight: 600 };

  // 여기 숫자만 살짝 바꿔서 눈으로 맞추면 됩니다
  const SCALE_QR1 = 1.03;  // QR1 조금 크게
  const SCALE_QR2 = 0.96;  // QR2 조금 작게

  return (
    <div style={row}>
      <div style={col}>
        <a href="https://m.site.naver.com/1O9lV" target="_blank" rel="noopener noreferrer" style={aStyle}>
          <div style={box}>
            <div style={inner(SCALE_QR1)}>
              <img src={qr1} alt="OK Cycling QR" style={imgStyle} />
            </div>
          </div>
          <div style={caption}>오케이사이클링 예약하기</div>
        </a>
      </div>

      <div style={col}>
        <a href="https://www.youtube.com/@cyclinglab" target="_blank" rel="noopener noreferrer" style={aStyle}>
          <div style={box}>
            <div style={inner(SCALE_QR2)}>
              <img src={qr2} alt="사이클박박사 유튜브 QR" style={imgStyle} />
            </div>
          </div>
          <div style={caption}>사이클박박사 유튜브</div>
        </a>
      </div>
    </div>
  );
};

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
              <button className="button primary" onClick={doAuth}>
                {T.login}
              </button>
            ) : (
              <>
                <span className="help">{user.email}</span>
                <button className="button" onClick={doLogout}>{STR[lang].logout}</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="container">
        <Notice />
      </div>

      {/* 본문 */}
      <div className="container" style={{ paddingTop: 8 }}>
        <div className="two-pane">
          {/* LEFT */}
          <div>
            {/* 기록 입력 · 저장 카드 */}
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
                <button className="button" onClick={()=>setEntries([])}>{STR[lang].reset}</button>
                <button className="button primary" onClick={handleSave}>
                  {user ? STR[lang].saveAccount : STR[lang].saveGuest}
                </button>
              </div>
            </div>

            {/* ➜ 새 카드: 기록입력저장 카드 “아래”에 별도 카드로 QR 표시 */}
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

      {/* 맨 위로 버튼 */}
      <button
        className={`fab-top ${showTop ? 'show' : ''}`}
        onClick={scrollTop}
        aria-label={lang==='en' ? 'Back to top' : '맨 위로'}
      >
        ↑ Top
      </button>

      {/* 저장 토스트 */}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
