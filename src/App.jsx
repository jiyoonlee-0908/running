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
    notice: 'Your records are saved when you log in. Made by Pro Juhyeok Park, OK Cycling.'
  },
  ko: {
    formTitle: '기록 입력 · 저장',
    dashTitle: '시각화 대시보드',
    reset: '초기화',
    saveGuest: '게스트로 저장(현재 브라우저)',
    saveAccount: '계정에 저장',
    login: 'Google로 계속',
    logout: '로그아웃',
    langEn: 'English',
    langKo: '한국어',
    notice: '로그인을 하면 기록이 저장됩니다. 오케이사이클링 박주혁프로가 제작했습니다.'
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('rg_lang') || 'ko')
  const T = STR[lang]

  const [name, setName] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { localStorage.setItem('rg_lang', lang) }, [lang])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null)
      setLoading(true)

      if (u) {
        const data = await loadEntries(u.uid)
        const fallback = u.displayName || (u.email ? u.email.split('@')[0] : '')
        setName((data.name && data.name.trim()) ? data.name : fallback)
        setEntries(data.entries || [])

        const guestRaw = localStorage.getItem('rd_guest')
        if (guestRaw) {
          try {
            const guest = JSON.parse(guestRaw)
            const count = Array.isArray(guest?.entries) ? guest.entries.length : 0
            if (count > 0 && window.confirm(lang === 'en'
              ? `Merge ${count} guest entries into your account?`
              : `게스트 모드에서 입력한 ${count}건을 계정으로 합칠까요?`)) {
              const res = await mergeGuestToUser(u.uid)
              if (res.mergedCount > 0) {
                const after = await loadEntries(u.uid)
                const afterName = (after.name && after.name.trim()) ? after.name : fallback
                setName(afterName)
                setEntries(after.entries || [])
                alert(lang === 'en' ? `Merged (${res.mergedCount})` : `머지 완료 (${res.mergedCount}건)`)
              }
            }
          } catch {}
        }
      } else {
        const data = await loadEntries(null)
        setName(data.name || '')
        setEntries(data.entries || [])
      }
      setLoading(false)
    })
    return () => unsub()
  }, [lang])

  const doLogin = async () => { try { await signInWithPopup(auth, googleProvider) } catch (e) { alert(e?.message || e) } }
  const doLogout = async () => { await signOut(auth) }

  const handleSave = async () => {
    const uid = user?.uid || null
    await saveEntries(uid, { name: name || '', entries })
    alert(uid ? (lang === 'en' ? 'Saved to account!' : '계정에 저장 완료!')
              : (lang === 'en' ? 'Saved in this browser (guest).' : '게스트로 저장됨(이 브라우저).'))
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
              <button className="button primary" onClick={doLogin}>{T.login}</button>
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

      {/* 본문: 항상 1:1 */}
      <div className="container" style={{ paddingTop: 8 }}>
        {loading ? (
          <div className="card">Loading...</div>
        ) : (
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
        )}
      </div>
    </>
  )
}
