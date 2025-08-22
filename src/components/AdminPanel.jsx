// src/components/AdminPanel.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { auth } from '../lib/firebase.js'
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collectionGroup, doc, getDoc, getDocs,
} from 'firebase/firestore'
import { db } from '../lib/firebase.js'
import { secondsToPace } from '../lib/utils.js'

const provider = new GoogleAuthProvider()

// CSV 유틸
function toCSV(rows) {
  const esc = (v) => {
    if (v == null) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map(r => r.map(esc).join(',')).join('\n')
}
function downloadCSV(filename, rows) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 날짜 필터
const inRange = (iso, from, to) => {
  if (!iso) return false
  const t = new Date(iso).getTime()
  if (Number.isFinite(from) && t < from) return false
  if (Number.isFinite(to) && t > to) return false
  return true
}

export default function AdminPanel() {
  const [me, setMe] = useState(null)
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [leftWidth, setLeftWidth] = useState(340)

  // 리사이저 핸들러
  const handleMouseDown = (e) => {
    setIsDragging(true)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    const newWidth = e.clientX
    if (newWidth >= 240 && newWidth <= window.innerWidth * 0.6) {
      setLeftWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  // 컴포넌트 언마운트시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // 좌측 리스트
  const [members, setMembers] = useState([])  // [{ uid, name, updatedAt, counts:{run,swim,bike}, total, email? }]
  const [q, setQ] = useState('')
  const [selUid, setSelUid] = useState(null)

  // 우측 상세
  const [datasets, setDatasets] = useState(null) // { run:[], swim:[], bike:[], name, updatedAt, email? }
  const [sport, setSport] = useState('run')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // 로그인 감시 + admins/{uid} 체크
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setMe(u || null)
      setIsAdmin(null)
      setDatasets(null)
      if (!u) return
      try {
        const adm = await getDoc(doc(db, 'admins', u.uid))
        setIsAdmin(adm.exists())
      } catch {
        setIsAdmin(false)
      }
    })
    return () => unsub()
  }, [])

  // 관리자면: 모든 users/{uid}/datasets/default 수집(컬렉션그룹)
  useEffect(() => {
    if (isAdmin !== true) return
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        // 🔑 핵심: 'datasets' 컬렉션 그룹 전체를 읽고, 문서 id가 'default' 인 것만 사용
        const snap = await getDocs(collectionGroup(db, 'datasets'))
        const rows = []
        for (const d of snap.docs) {
          if (d.id !== 'default') continue         // 각 유저의 대표 문서만 사용
          const data = d.data() || {}
          const uid = d.ref.parent.parent.id      // users/{uid}/datasets/default → uid 추출

          const by = data.entriesBySport || { run: [], swim: [], bike: [] }
          const cRun  = Array.isArray(by.run)  ? by.run.length  : 0
          const cSwim = Array.isArray(by.swim) ? by.swim.length : 0
          const cBike = Array.isArray(by.bike) ? by.bike.length : 0

          const updatedAt = data.updatedAt?.toDate?.() || null
          const name =
            (data.name || '').trim() ||
            (data.displayName || '') ||
            (data.email ? String(data.email).split('@')[0] : '') ||
            uid.slice(0,8)

          rows.push({
            uid,
            name,
            updatedAt,
            counts: { run: cRun, swim: cSwim, bike: cBike },
            total: cRun + cSwim + cBike,
            email: data.email || '',
          })
        }

        if (alive) {
          rows.sort((a,b) => (b.updatedAt?.getTime?.()||0) - (a.updatedAt?.getTime?.()||0))
          setMembers(rows)
          if (!selUid && rows[0]) setSelUid(rows[0].uid)
        }
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  // 선택 회원 상세
  useEffect(() => {
    if (!selUid || isAdmin !== true) return
    let alive = true
    ;(async () => {
      setDatasets(null)
      const ds = await getDoc(doc(db, 'users', selUid, 'datasets', 'default'))
      if (!alive) return
      if (!ds.exists()) { setDatasets({ run:[], swim:[], bike:[], name:'', updatedAt:null }); return }
      const data = ds.data() || {}
      const by = data.entriesBySport || { run: [], swim: [], bike: [] }
      setDatasets({
        run: Array.isArray(by.run) ? by.run : [],
        swim: Array.isArray(by.swim) ? by.swim : [],
        bike: Array.isArray(by.bike) ? by.bike : [],
        name: (data.name || '').trim(),
        email: data.email || '',
        updatedAt: data.updatedAt?.toDate?.() || null,
      })
    })()
    return () => { alive = false }
  }, [selUid, isAdmin])

  // 필터
  const rangeFrom = from ? new Date(from).getTime() : NaN
  const rangeTo   = to   ? (new Date(to).getTime() + 24*60*60*1000 - 1) : NaN
  const rows = useMemo(() => {
    if (!datasets) return []
    const arr = datasets[sport] || []
    return arr.filter(e => inRange(e.date, rangeFrom, rangeTo))
              .map((e, i) => ({ ...e, _i: i }))
  }, [datasets, sport, rangeFrom, rangeTo])

  // 요약
  const summary = useMemo(() => {
    if (!rows.length) return { sessions: 0, dist: 0, avgPace: '', avgHR: '' }
    const sessions = rows.length
    const dist = rows.reduce((s, r) => s + (Number(r.dist)||0), 0)
    const avgPaceSecArr = rows.map(r => Number(r.avgPace)).filter(Number.isFinite)
    const avgPace =
      avgPaceSecArr.length ? secondsToPace(avgPaceSecArr.reduce((a,b)=>a+b,0) / avgPaceSecArr.length) : ''
    const hrArr = rows.map(r => Number(r.avgHR)).filter(Number.isFinite)
    const avgHR = hrArr.length ? Math.round(hrArr.reduce((a,b)=>a+b,0) / hrArr.length) : ''
    return { sessions, dist, avgPace, avgHR }
  }, [rows])

  // 좌측 검색
  const list = useMemo(() => {
    const key = q.trim().toLowerCase()
    const arr = key
      ? members.filter(m =>
          (m.name || '').toLowerCase().includes(key) ||
          (m.email || '').toLowerCase().includes(key) ||
          m.uid.toLowerCase().includes(key))
      : members
    return arr
  }, [members, q])

  // /910908 검색엔진 제외
  useEffect(() => {
    const el = document.querySelector('meta[name="robots"]') || document.createElement('meta')
    el.setAttribute('name', 'robots')
    el.setAttribute('content', 'noindex,nofollow')
    document.head.appendChild(el)
    return () => { el.setAttribute('content','index,follow') }
  }, [])

  // UI ---------------------------------------------------------------------
  if (!me) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel">
          <div className="admin-top">
            <div className="admin-title">Admin · Sign in</div>
            <button className="button primary" onClick={() => signInWithPopup(auth, provider)}>Google 로그인</button>
          </div>
          <div className="admin-empty">관리자 페이지는 로그인 후 이용 가능합니다.</div>
        </div>
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel">
          <div className="admin-top">
            <div className="admin-title">권한 없음</div>
            <button className="button" onClick={() => signOut(auth)}>로그아웃</button>
          </div>
          <div className="admin-empty">관리자 권한이 없습니다. (admins/내UID 문서가 필요)</div>
        </div>
      </div>
    )
  }

  if (isAdmin === null || loading) {
    return (
      <div className="admin-overlay">
        <div className="admin-panel">
          <div className="admin-top"><div className="admin-title">Loading…</div></div>
          <div className="admin-empty">불러오는 중…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        <div className="admin-top">
          <div className="admin-title">관리자 · 회원 관리</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input
              className="admin-search"
              placeholder="이름/이메일/UID 검색"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
            />
            <button className="button" onClick={()=>location.href='/'}>메인으로</button>
            <button className="button" onClick={()=>signOut(auth)}>로그아웃</button>
          </div>
        </div>

        <div className="admin-body">
          {/* LEFT */}
          <div className="admin-left" style={{ width: leftWidth + 'px' }}>
            <div 
              className="admin-resizer"
              data-dragging={isDragging}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDragging(true);
                document.body.classList.add('resizing');
                
                const startX = e.pageX;
                const startWidth = leftWidth;
                
                const handleMouseMove = (e) => {
                  const newWidth = Math.max(200, Math.min(800, startWidth + e.pageX - startX));
                  setLeftWidth(newWidth);
                };
                
                const handleMouseUp = () => {
                  setIsDragging(false);
                  document.body.classList.remove('resizing');
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
            <div 
              className={`admin-resizer ${isDragging ? 'dragging' : ''}`}
              onMouseDown={handleMouseDown}
              style={{ left: leftWidth }}
            />
            <div className="admin-list-wrap">
              <table className="admin-list">
                <thead>
                  <tr>
                    <th style={{width:180}}>Name</th>
                    <th style={{width:200}}>Email</th>
                    <th style={{width:140}}>UID</th>
                    <th style={{width:120}}>Updated</th>
                    <th style={{width:80}}>Run</th>
                    <th style={{width:80}}>Swim</th>
                    <th style={{width:80}}>Cycl</th>
                    <th style={{width:80}}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(m => (
                    <tr key={m.uid} className={selUid===m.uid ? 'sel' : ''} onClick={()=>setSelUid(m.uid)} style={{cursor:'pointer'}}>
                      <td title={m.name}>{m.name || '-'}</td>
                      <td title={m.email || ''}>{m.email || '-'}</td>
                      <td className="mono" title={m.uid}>{m.uid.slice(0,10)}…</td>
                      <td>{m.updatedAt ? m.updatedAt.toISOString().slice(0,10) : '-'}</td>
                      <td className="num">{m.counts.run}</td>
                      <td className="num">{m.counts.swim}</td>
                      <td className="num">{m.counts.bike}</td>
                      <td className="num" style={{fontWeight:800}}>{m.total}</td>
                    </tr>
                  ))}
                  {list.length===0 && <tr><td colSpan="8" className="admin-empty">회원이 없습니다.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT */}
          <div className="admin-right">
            {!datasets ? (
              <div className="admin-empty">선택된 회원이 없습니다.</div>
            ) : (
              <>
                <div className="admin-detail-top">
                  <div>
                    <div className="admin-member-name">{datasets.name || selUid}</div>
                    <div className="admin-member-sub">
                      {datasets.email ? `${datasets.email} · ` : ''}Updated: {datasets.updatedAt ? datasets.updatedAt.toISOString().slice(0,19).replace('T',' ') : '-'}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    {['run','swim','bike'].map(s=>(
                      <button key={s} className={`tab ${sport===s?'active':''}`} onClick={()=>setSport(s)}>
                        {({run:'Running',swim:'Swimming',bike:'Cycling'})[s]}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="admin-search" style={{minWidth:140}}/>
                    <span>~</span>
                    <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="admin-search" style={{minWidth:140}}/>
                    <button className="button" onClick={()=>{setFrom('');setTo('')}}>초기화</button>
                    <button className="button primary" onClick={()=>{
                      const header = [
                        'date','dist(km)','avgPace(s)','maxPace(s)','avgHR','maxHR',
                        'avgPower','maxPower','avgCad','maxCad','stride(cm)','gct(ms)','vRatio(%)','vOsc(cm)'
                      ]
                      const body = rows.map(r => [
                        r.date, r.dist ?? '', r.avgPace ?? '', r.maxPace ?? '', r.avgHR ?? '', r.maxHR ?? '',
                        r.avgPower ?? '', r.maxPower ?? '', r.avgCad ?? '', r.maxCad ?? '',
                        r.stride ?? '', r.gct ?? '', r.vRatio ?? '', r.vOsc ?? ''
                      ])
                      downloadCSV(`${selUid}_${sport}.csv`, [header, ...body])
                    }}>CSV</button>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, padding:'12px'}}>
                  <div className="card"><div className="help">Sessions</div><div style={{fontWeight:900, fontSize:18}}>{summary.sessions}</div></div>
                  <div className="card"><div className="help">Total Dist (km)</div><div style={{fontWeight:900, fontSize:18}}>{summary.dist.toFixed(2)}</div></div>
                  <div className="card"><div className="help">Avg Pace</div><div style={{fontWeight:900, fontSize:18}}>{summary.avgPace || '-'}</div></div>
                  <div className="card"><div className="help">Avg HR</div><div style={{fontWeight:900, fontSize:18}}>{summary.avgHR || '-'}</div></div>
                </div>

                <div className="admin-table-wrap" style={{padding:'0 12px 12px'}}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{width:110}}>Date</th>
                        <th style={{width:90}}>Dist</th>
                        <th style={{width:90}}>Avg Pace</th>
                        <th style={{width:90}}>Max Pace</th>
                        <th style={{width:90}}>Avg HR</th>
                        <th style={{width:90}}>Max HR</th>
                        <th style={{width:90}}>Avg Pow</th>
                        <th style={{width:90}}>Max Pow</th>
                        <th style={{width:90}}>Avg Cad</th>
                        <th style={{width:90}}>Max Cad</th>
                        <th style={{width:90}}>Stride</th>
                        <th style={{width:90}}>GCT</th>
                        <th style={{width:90}}>V Ratio</th>
                        <th style={{width:90}}>V Osc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r._i}>
                          <td>{r.date}</td>
                          <td className="num">{r.dist ?? ''}</td>
                          <td className="num">{secondsToPace(r.avgPace)}</td>
                          <td className="num">{secondsToPace(r.maxPace)}</td>
                          <td className="num">{r.avgHR ?? ''}</td>
                          <td className="num">{r.maxHR ?? ''}</td>
                          <td className="num">{r.avgPower ?? ''}</td>
                          <td className="num">{r.maxPower ?? ''}</td>
                          <td className="num">{r.avgCad ?? ''}</td>
                          <td className="num">{r.maxCad ?? ''}</td>
                          <td className="num">{r.stride ?? ''}</td>
                          <td className="num">{r.gct ?? ''}</td>
                          <td className="num">{r.vRatio ?? ''}</td>
                          <td className="num">{r.vOsc ?? ''}</td>
                        </tr>
                      ))}
                      {rows.length===0 && <tr><td colSpan="14" className="admin-empty">해당 기간 데이터가 없습니다.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
