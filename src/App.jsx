// src/App.jsx
import React, { useEffect, useState } from 'react'
import Login from './components/Login.jsx'
import EntryForm from './components/EntryForm.jsx'
import Dashboard from './components/Dashboard.jsx'
import { loadEntries, saveEntries } from './lib/storage.js'
import { auth } from './lib/firebase.js'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function App() {
  const [user, setUser] = useState(null)
  const [name, setName] = useState('박 주혁')
  const [entries, setEntries] = useState([]) // { date, avgPace, ... }
  const [loading, setLoading] = useState(true)

  // Firebase Auth 상태 구독
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null)
      if (u) {
        setLoading(true)
        try {
          const data = await loadEntries(u.uid)
          setName(data.name || '박 주혁')
          setEntries(data.entries || [])
        } finally {
          setLoading(false)
        }
      } else {
        setName('박 주혁')
        setEntries([])
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
  }

  const handleSave = async () => {
    if (!user) return
    await saveEntries(user.uid, { name, entries })
    alert('저장 완료!')
  }

  return (
    <>
      <div className="header">
        <div className="nav container">
          <h1>러닝 대시보드</h1>
          <span className="badge">Google 로그인 · 사용자별 Firestore 저장</span>
          <div style={{ marginLeft: 'auto', display:'flex', gap:8, alignItems:'center' }}>
            {user && <span className="help">{user.email}</span>}
            {user && <button className="button" onClick={handleLogout}>로그아웃</button>}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 16 }}>
        {loading ? (
          <div className="card">로딩중...</div>
        ) : !user ? (
          <Login onLogin={setUser} />
        ) : (
          <div className="grid grid-2">
            <div className="card">
              <h3 style={{marginTop:0}}>기록 입력 · 저장</h3>
              <div className="row">
                <div className="col">
                  <label className="help">이름</label>
                  <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="이름" />
                </div>
              </div>
              <EntryForm entries={entries} setEntries={setEntries} />
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
                <button className="button" onClick={()=>setEntries([])}>초기화</button>
                <button className="button primary" onClick={handleSave}>저장</button>
              </div>
            </div>

            <div className="card">
              <h3 style={{marginTop:0}}>시각화 대시보드</h3>
              <Dashboard name={name} entries={entries} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
