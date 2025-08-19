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

const UNITS = {
  distance: ' km',
  avgPace: '', maxPace: '',
  avgHR: ' bpm',  maxHR: ' bpm',
  avgPower: ' W', maxPower: ' W',
  avgCad: ' rpm', maxCad: ' rpm',
  stride: ' cm', gct: ' ms',
  vRatio: ' %',  vOsc: ' cm',
}

const COLORS = {
  avg: '#1d4ed8',
  max: '#ef4444',
  mono: '#111827',
}

const getDistance = (e) => e.dist ?? e.distance ?? e.distKm ?? e.km ?? null
const paceTick = (v) => secondsToPace(v || 0)
const numTick  = (v) => v

export default function Dashboard({ entries = [], lang = 'ko' }) {
  const L = TXT[lang]

  const data = useMemo(() => {
    const arr = entries || []
    const dist = arr.map(e => ({ date: e.date, val: getDistance(e) }))
    const pair = (kAvg, kMax) =>
      arr.map(e => ({ date: e.date, avg: e[kAvg] ?? null, max: e[kMax] ?? null }))
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

  const [activeTab, setActiveTab] = useState('stride')

  const TAB_META = useMemo(() => ({
    stride: { label: L.stride, color: COLORS.mono, unit: UNITS.stride, yTick: numTick,  data: data.tabs.stride },
    gct:    { label: L.gct,    color: COLORS.mono, unit: UNITS.gct,    yTick: numTick,  data: data.tabs.gct },
    vRatio: { label: L.vRatio, color: COLORS.mono, unit: UNITS.vRatio, yTick: numTick,  data: data.tabs.vRatio },
    vOsc:   { label: L.vOsc,   color: COLORS.mono, unit: UNITS.vOsc,   yTick: numTick,  data: data.tabs.vOsc },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data, lang])

  /* ===== 공통 렌더러 ===== */
  const PairChart = ({ id, title, rows, yTick, unitAvgKey, unitMaxKey }) => {
    return (
      <div id={id} className="chart-card one">
        <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{title}</h4>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 24, right: 16, bottom: 10, left: 0 }}>
              {/* ↑ top 여백을 24로 늘려 범례와 제목 간 간격 확보 */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={yTick} />
              <Tooltip
                separator=""
                labelFormatter={(l) => l}
                formatter={(v, key) => {
                  const metricKey = key === 'avg' ? unitAvgKey : unitMaxKey
                  const val = (metricKey === 'avgPace' || metricKey === 'maxPace') ? secondsToPace(v) : v
                  const unit = UNITS[metricKey] || ''
                  const label = key === 'avg' ? L.formAvg : L.formMax
                  return [`${val}${unit}`, label]
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={10}                 // ← 아이콘 25% 축소
                wrapperStyle={{ top: 6, right: 4, fontSize: 12 }}
                formatter={(v) => v === 'avg' ? L.formAvg : L.formMax}
              />
              <Line type="monotone" name="avg" dataKey="avg" stroke={COLORS.avg} dot={{ r: 4 }} strokeWidth={2}/>
              <Line type="monotone" name="max" dataKey="max" stroke={COLORS.max} dot={{ r: 4 }} strokeWidth={2}/>
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
          <LineChart data={data.dist} margin={{ top: 12, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v)=>v} />
            <Tooltip separator="" labelFormatter={(l)=> l} formatter={(v)=> [`${v}${UNITS.distance}`, '']} />
            <Line type="monotone" dataKey="val" stroke={COLORS.mono} dot={{ r: 4 }} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const TabsChart = () => {
    const meta = TAB_META[activeTab]
    return (
      <div id="chart-tabs" className="chart-card one">
        <div className="subtabs" style={{ justifyContent:'center' }}>
          {Object.keys(TAB_META).map(k => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`tab ${activeTab === k ? 'active' : ''}`}
            >
              {TAB_META[k].label}
            </button>
          ))}
        </div>

        <div className="chart" style={{ paddingTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={meta.data} margin={{ top: 8, right: 16, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={meta.yTick} />
              <Tooltip
                separator=""
                labelFormatter={(l)=> l}
                formatter={(v)=> [`${meta.yTick ? meta.yTick(v) : v}${meta.unit || ''}`, '']}
              />
              <Line type="monotone" dataKey="val" stroke={meta.color} dot={{ r: 4 }} strokeWidth={2}/>
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
