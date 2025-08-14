// src/components/Dashboard.jsx
import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip, Legend,
} from 'recharts'
import { secondsToPace } from '../lib/utils.js'

/* ===== 라벨/텍스트 ===== */
const TXT = {
  ko: {
    distance: '거리',
    pacePair: '평균·최고 페이스',
    hrPair: '평균·최대 심박수',
    powerPair: '평균·최대 파워',
    cadPair: '평균·최대 케이던스',
    formAvg: '평균',
    formMax: '최대',

    stride: '보행길이',
    gct: '접지시간',
    vRatio: '수직비율',
    vOsc: '수직진폭',
  },
  en: {
    distance: 'Distance',
    pacePair: 'Avg · Max Pace',
    hrPair: 'Avg · Max Heart Rate',
    powerPair: 'Avg · Max Power',
    cadPair: 'Avg · Max Cadence',
    formAvg: 'Avg',
    formMax: 'Max',

    stride: 'Stride',
    gct: 'Ground Contact',
    vRatio: 'Vertical Ratio',
    vOsc: 'Vertical Osc.',
  }
}

/* ===== 단위 ===== */
const UNITS = {
  distance: ' km',
  avgPace: '', maxPace: '',               // pace는 mm:ss로 포맷
  avgHR: ' bpm',  maxHR: ' bpm',
  avgPower: ' W', maxPower: ' W',
  avgCad: ' rpm', maxCad: ' rpm',
  stride: ' cm', gct: ' ms',
  vRatio: ' %',  vOsc: ' cm',
}

/* ===== 색상 ===== */
const COLORS = {
  avg: '#1d4ed8',  // 파랑
  max: '#ef4444',  // 빨강
  mono: '#111827', // 단일(탭/거리)
}

/* ===== 유틸 ===== */
const getDistance = (e) => e.dist ?? e.distance ?? e.distKm ?? e.km ?? null
const paceTick = (v) => secondsToPace(v || 0)
const numTick  = (v) => v

// 0이면 라벨만 숨기는 포맷터
const fmtNoZero = (fmt, unit = '') => (v) => {
  if (v === 0) return ''              // 0 라벨 숨김
  const base = fmt ? fmt(v) : v
  return `${base}${unit}`
}

/* ===== 메인 컴포넌트 ===== */
export default function Dashboard({ entries = [], lang = 'ko' }) {
  const L = TXT[lang]

  // 데이터 가공
  const data = useMemo(() => {
    const arr = entries || []

    const dist = arr.map(e => ({ date: e.date, val: getDistance(e) }))

    const pair = (kAvg, kMax) =>
      arr.map(e => ({
        date: e.date,
        avg: e[kAvg] ?? null,
        max: e[kMax] ?? null,
      }))

    const stride = arr.map(e => ({ date: e.date, val: e.stride ?? null }))
    const gct    = arr.map(e => ({ date: e.date, val: e.gct ?? null }))
    const vRatio = arr.map(e => ({ date: e.date, val: e.vRatio ?? null }))
    const vOsc   = arr.map(e => ({ date: e.date, val: e.vOsc ?? null }))

    return {
      dist,
      pace:  pair('avgPace',  'maxPace'),
      hr:    pair('avgHR',    'maxHR'),
      power: pair('avgPower', 'maxPower'),
      cad:   pair('avgCad',   'maxCad'),
      tabs:  { stride, gct, vRatio, vOsc }
    }
  }, [entries])

  // 탭 상태
  const [activeTab, setActiveTab] = useState('stride')

  // 탭 메타
  const TAB_META = useMemo(() => ({
    stride: { label: L.stride, color: COLORS.mono, unit: UNITS.stride, yTick: numTick,  data: data.tabs.stride },
    gct:    { label: L.gct,    color: COLORS.mono, unit: UNITS.gct,    yTick: numTick,  data: data.tabs.gct },
    vRatio: { label: L.vRatio, color: COLORS.mono, unit: UNITS.vRatio, yTick: numTick,  data: data.tabs.vRatio },
    vOsc:   { label: L.vOsc,   color: COLORS.mono, unit: UNITS.vOsc,   yTick: numTick,  data: data.tabs.vOsc },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data, lang])

  /* ===== 공통 렌더러 ===== */
  const PairChart = ({ id, title, rows, yTick, unitAvgKey, unitMaxKey }) => {
    const isPace = unitAvgKey === 'avgPace' || unitMaxKey === 'maxPace'
    const axisTick = isPace
      ? (v) => (v === 0 ? '' : paceTick(v))                  // 0:00 숨김
      : fmtNoZero(null, UNITS[unitAvgKey] || '')             // 숫자 + 단위, 0 숨김

    return (
      <div id={id} className="chart-card one">
        <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{title}</h4>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 16, right: 16, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={axisTick} />
              <Tooltip
                separator="" // 콜론 제거
                labelFormatter={(l) => l}
                formatter={(v, key) => {
                  // key => 'avg' | 'max'
                  const metricKey = key === 'avg' ? unitAvgKey : unitMaxKey
                  const val = (metricKey === 'avgPace' || metricKey === 'maxPace')
                    ? secondsToPace(v)
                    : v
                  const unit = UNITS[metricKey] || ''
                  const label = key === 'avg' ? L.formAvg : L.formMax
                  return [`${val}${unit}`, label]
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ top: -8, right: 4, fontSize: 12 }} // 살짝 위, 작게
                formatter={(v) => v === 'avg' ? L.formAvg : L.formMax}
              />
              <Line type="monotone" name="avg" dataKey="avg" stroke={COLORS.avg} dot strokeWidth={2}/>
              <Line type="monotone" name="max" dataKey="max" stroke={COLORS.max} dot strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const DistanceChart = () => (
    <div id="chart-distance" className="chart-card one">
      <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{L.distance}</h4>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.dist} margin={{ top: 16, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={fmtNoZero(null, UNITS.distance)} // "0 km" 숨김
            />
            <Tooltip
              separator=""
              labelFormatter={(l)=> l}
              formatter={(v)=> [`${v}${UNITS.distance}`, '']}
            />
            <Line type="monotone" dataKey="val" stroke={COLORS.mono} dot strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const TabsChart = () => {
    const meta = TAB_META[activeTab]
    return (
      <div id="chart-tabs" className="chart-card one">
        {/* 탭 헤더 (활성 탭만 밑줄, 글자 크기 20) */}
        <div style={{ display:'flex', gap:24, alignItems:'flex-end', margin:'0 8px 8px' }}>
          {Object.keys(TAB_META).map(k => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              style={{
                border:'none',
                background:'transparent',
                padding:'2px 0 6px',
                cursor:'pointer',
                fontSize: 20,
                fontWeight: activeTab === k ? 800 : 700,
                color: activeTab === k ? '#111827' : '#6b7280',
                borderBottom: activeTab === k ? '3px solid #111827' : '3px solid transparent'
              }}
            >
              {TAB_META[k].label}
            </button>
          ))}
        </div>

        {/* 선택된 탭 차트 */}
        <div className="chart" style={{ paddingTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={meta.data} margin={{ top: 8, right: 16, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={fmtNoZero(meta.yTick, meta.unit)} // 0 숨김 + 단위
              />
              <Tooltip
                separator=""                 // ":" 제거
                labelFormatter={(l)=> l}
                formatter={(v)=> [
                  `${meta.yTick ? meta.yTick(v) : v}${meta.unit || ''}`,
                  ''
                ]}
              />
              <Line type="monotone" dataKey="val" stroke={meta.color} dot strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="charts-stack">
        <DistanceChart />

        <PairChart
          id="chart-pace"
          title={L.pacePair}
          rows={data.pace}
          yTick={paceTick}
          unitAvgKey="avgPace"
          unitMaxKey="maxPace"
        />

        <PairChart
          id="chart-hr"
          title={L.hrPair}
          rows={data.hr}
          yTick={numTick}
          unitAvgKey="avgHR"
          unitMaxKey="maxHR"
        />

        <PairChart
          id="chart-power"
          title={L.powerPair}
          rows={data.power}
          yTick={numTick}
          unitAvgKey="avgPower"
          unitMaxKey="maxPower"
        />

        <PairChart
          id="chart-cad"
          title={L.cadPair}
          rows={data.cad}
          yTick={numTick}
          unitAvgKey="avgCad"
          unitMaxKey="maxCad"
        />

        <TabsChart />
      </div>
    </div>
  )
}
