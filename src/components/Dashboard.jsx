// src/components/Dashboard.jsx
import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { secondsToPace } from '../lib/utils.js'

const METRICS = [
  { key:'avgPace', label:'평균 페이스', type:'pace' },
  { key:'maxPace', label:'최고 페이스', type:'pace' },
  { key:'avgHR', label:'평균심박수', type:'num' },
  { key:'maxHR', label:'최대심박수', type:'num' },
  { key:'avgPower', label:'평균파워', type:'num' },
  { key:'maxPower', label:'최대파워', type:'num' },
  { key:'avgCad', label:'평균케이던스', type:'num' },
  { key:'maxCad', label:'최대케이던스', type:'num' },
  { key:'stride', label:'보행길이', type:'num' },
  { key:'vRatio', label:'수직비율', type:'num' },
  { key:'vOsc', label:'수직진폭', type:'num' },
  { key:'gct', label:'접지시간', type:'num' }
]

function Dashboard({ name, entries }) {
  const dataByMetric = useMemo(() => {
    const base = {}
    for (const m of METRICS) {
      base[m.key] = (entries || []).map(e => ({
        date: e.date,
        val: e[m.key] ?? null
      }))
    }
    return base
  }, [entries])

  return (
    <div className="grid">
      <div className="help">이름: <b>{name}</b> · 총 {entries?.length || 0}건</div>
      <div className="grid">
        {METRICS.map(m => (
          <div className="card" key={m.key}>
            <div style={{fontWeight:600, marginBottom:8}}>{m.label} 변화 추이</div>
            <div style={{height:260}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataByMetric[m.key]} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v)=> m.type==='pace' ? secondsToPace(v||0) : v}
                  />
                  <Tooltip
                    formatter={(v)=> m.type==='pace' ? secondsToPace(v||0) : v}
                    labelFormatter={(l)=> `날짜: ${l}`}
                  />
                  <Line type="monotone" dataKey="val" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 둘 다 내보내서, 실수로 named import를 써도 작동하게 안전장치
export default Dashboard
export { Dashboard }
