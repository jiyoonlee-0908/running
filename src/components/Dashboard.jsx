import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { secondsToPace } from '../lib/utils.js'

/* 표시 순서(페어링) */
const ORDER = [
  'avgPace','maxPace',
  'avgHR','maxHR',
  'avgPower','maxPower',
  'avgCad','maxCad',
  'stride','gct','vRatio','vOsc'
]

const LABELS = {
  en: {
    avgPace:'Avg Pace', maxPace:'Max Pace',
    avgHR:'Avg HR', maxHR:'Max HR',
    avgPower:'Avg Power', maxPower:'Max Power',
    avgCad:'Avg Cadence', maxCad:'Max Cadence',
    stride:'Stride Length', gct:'Ground Contact Time', vRatio:'Vertical Ratio', vOsc:'Vertical Oscillation'
  },
  ko: {
    avgPace:'평균 페이스', maxPace:'최고 페이스',
    avgHR:'평균심박수', maxHR:'최대심박수',
    avgPower:'평균파워', maxPower:'최대파워',
    avgCad:'평균케이던스', maxCad:'최대케이던스',
    stride:'보행길이', gct:'접지시간', vRatio:'수직비율', vOsc:'수직진폭'
  }
}

/* 툴팁 단위 정의 */
const UNITS = {
  avgPace:'', maxPace:'',
  avgHR:' bpm', maxHR:' bpm',
  avgPower:' W', maxPower:' W',
  avgCad:' rpm', maxCad:' rpm',
  stride:' cm', gct:' ms', vRatio:' %', vOsc:' cm'
}
const TYPES = { avgPace:'pace', maxPace:'pace' }

function formatValue(metric, v){
  if (v == null) return ''
  if (TYPES[metric] === 'pace') return secondsToPace(v)
  const unit = UNITS[metric] || ''
  return `${v}${unit}`
}

export default function Dashboard({ name, entries, lang='en' }) {
  const L = LABELS[lang]

  const byMetric = useMemo(() => {
    const base = {}
    for (const key of ORDER) base[key] = (entries || []).map(e => ({ date: e.date, val: e[key] ?? null }))
    return base
  }, [entries])

  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior:'smooth', block:'start' }) }

  return (
    <div className="grid">
      {/* 항목 버튼 */}
      <div className="metric-nav">
        {ORDER.map(k => (
          <button key={k} className="metric-btn" onClick={()=>scrollTo(`chart-${k}`)}>
            <span className="dot" style={{background: getColor(k)}}></span>
            <span style={{color:'var(--fg)'}}>{L[k]}</span>
          </button>
        ))}
      </div>

      {/* 2개씩 한 줄 */}
      <div className="charts-2">
        {ORDER.map(k => (
          <div key={k} id={`chart-${k}`} className="card">
            <h4 className="chart-card-title">{L[k]}</h4>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byMetric[k]} margin={{ top: 10, right: 16, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v)=> (TYPES[k]==='pace' ? secondsToPace(v||0) : v)}
                  />
                  <Tooltip
                    formatter={(v)=> [formatValue(k, v), L[k]]}
                    labelFormatter={(l)=> (lang==='en' ? `Date: ${l}` : `날짜: ${l}`)}
                  />
                  <Line type="monotone" dataKey="val" strokeWidth={2} dot={true} stroke={getColor(k)} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getColor(key){
  const COLORS = {
    avgPace:'var(--c-avgPace)', maxPace:'var(--c-maxPace)',
    avgHR:'var(--c-avgHR)', maxHR:'var(--c-maxHR)',
    avgPower:'var(--c-avgPower)', maxPower:'var(--c-maxPower)',
    avgCad:'var(--c-avgCad)', maxCad:'var(--c-maxCad)',
    stride:'var(--c-stride)', gct:'var(--c-gct)', vRatio:'var(--c-vRatio)', vOsc:'var(--c-vOsc)'
  }
  return COLORS[key] || 'var(--fg)'
}
