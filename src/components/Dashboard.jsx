// src/components/Dashboard.jsx
import React, { useMemo, useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { secondsToPace } from '../lib/utils.js'

const TXT = {
  ko: {
    distance: '거리',
    pacePair: '평균·최대 페이스',
    hrPair: '평균·최대 심박수',
    powerPair: '평균·최대 파워',
    cadPair: '평균·최대 케이던스',
    formAvg: '평균',
    formMax: '최대',

    // 러닝 탭
    stride: '보행길이',
    gct: '접지시간',
    vRatio: '수직비율',
    vOsc: '수직진폭',

    // 수영 전용
    swimStrokePair: '총스트로크·평균 스트로크율',
    swimSwolfAvg: '평균 Swolf',

    // 사이클링 전용
    bikeBRTriple: '평균·최저·최대 호흡속도',
    bikePedalStrokes: '총 페달 스트로크',
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

    swimStrokePair: 'Total Strokes · Avg Stroke Rate',
    swimSwolfAvg: 'Avg Swolf',

    bikeBRTriple: 'Avg · Min · Max Breathing Rate',
    bikePedalStrokes: 'Total Pedal Strokes',
  }
}

const UNITS = {
  distance: ' km',
  avgPace: '', maxPace: '',
  avgHR: ' bpm', maxHR: ' bpm',
  avgPower: ' W', maxPower: ' W',
  avgCad: ' rpm', maxCad: ' rpm',
  stride: ' cm', gct: ' ms', vRatio: ' %', vOsc: ' cm',

  // swim
  totalStrokes: ' 개',
  avgStrokeRate: ' spm',
  avgSwolf: '',

  // bike
  avgBR: ' brpm', minBR: ' brpm', maxBR: ' brpm',
  totalPedalStrokes: ' 개',
}

const COLORS = { avg: '#1d4ed8', max: '#ef4444', mono: '#111827' }

const getDistance = (e) => e.dist ?? e.distance ?? e.distKm ?? e.km ?? null
const paceTick = (v) => secondsToPace(v || 0)
const numTick = (v) => v

export default function Dashboard({ entries = [], lang = 'ko', sport='run' }) {
  const L = TXT[lang]

  const data = useMemo(() => {
    const arr = entries || []

    const dist = arr
      .filter(e => getDistance(e) != null)
      .map(e => ({ date: e.date, val: getDistance(e) }))

    const pair = (kAvg, kMax) =>
      arr
        .filter(e => (e[kAvg] ?? null) != null || (e[kMax] ?? null) != null)
        .map(e => ({ date: e.date, avg: e[kAvg] ?? null, max: e[kMax] ?? null }))

    // 러닝 전용 탭
    const stride = arr.filter(e => e.stride != null).map(e => ({ date: e.date, val: e.stride }))
    const gct    = arr.filter(e => e.gct    != null).map(e => ({ date: e.date, val: e.gct }))
    const vRatio = arr.filter(e => e.vRatio != null).map(e => ({ date: e.date, val: e.vRatio }))
    const vOsc   = arr.filter(e => e.vOsc   != null).map(e => ({ date: e.date, val: e.vOsc }))

    // 수영 전용
    const swimStrokePair = arr
      .filter(e => (e.totalStrokes ?? null) != null || (e.avgStrokeRate ?? null) != null)
      .map(e => ({ date: e.date, total: e.totalStrokes ?? null, rate: e.avgStrokeRate ?? null }))
    const swimSwolf = arr
      .filter(e => e.avgSwolf != null)
      .map(e => ({ date: e.date, val: e.avgSwolf }))

    // 사이클링 전용
    const brTriple = arr
      .filter(e => (e.avgBR ?? null) != null || (e.minBR ?? null) != null || (e.maxBR ?? null) != null)
      .map(e => ({ date: e.date, avg: e.avgBR ?? null, min: e.minBR ?? null, max: e.maxBR ?? null }))
    const pedalTotal = arr
      .filter(e => e.totalPedalStrokes != null)
      .map(e => ({ date: e.date, val: e.totalPedalStrokes }))

    return {
      dist,
      pace: pair('avgPace', 'maxPace'),
      hr:   pair('avgHR', 'maxHR'),
      power: pair('avgPower', 'maxPower'),
      cad:   pair('avgCad', 'maxCad'),

      runTabs: { stride, gct, vRatio, vOsc },
      swim: { strokePair: swimStrokePair, swolf: swimSwolf },
      bike: { brTriple, pedalTotal },
    }
  }, [entries])

  /* ===== 공통 렌더러 ===== */
  const PairChart = ({ id, title, rows, yTick, unitAvgKey, unitMaxKey }) => (
    <div id={id} className="chart-card one">
      <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{title}</h4>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 24, right: 16, bottom: 10, left: 0 }}>
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
              verticalAlign="top" align="right"
              iconType="circle" iconSize={10}
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

  // 러닝 탭
  const [activeTab, setActiveTab] = useState('stride')
  const runTAB_META = useMemo(() => ({
    stride: { label: TXT[lang].stride, color: COLORS.mono, unit: UNITS.stride, yTick: numTick, data: data.runTabs.stride },
    gct:    { label: TXT[lang].gct,    color: COLORS.mono, unit: UNITS.gct,    yTick: numTick, data: data.runTabs.gct },
    vRatio: { label: TXT[lang].vRatio, color: COLORS.mono, unit: UNITS.vRatio, yTick: numTick, data: data.runTabs.vRatio },
    vOsc:   { label: TXT[lang].vOsc,   color: COLORS.mono, unit: UNITS.vOsc,   yTick: numTick, data: data.runTabs.vOsc },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data, lang])

  const RunTabsChart = () => {
    const meta = runTAB_META[activeTab]
    return (
      <div id="chart-tabs" className="chart-card one">
        <div className="subtabs" style={{ justifyContent:'center' }}>
          {Object.keys(runTAB_META).map(k => (
            <button key={k} onClick={() => setActiveTab(k)} className={`tab ${activeTab === k ? 'active' : ''}`} >
              {runTAB_META[k].label}
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

  // 수영 전용
  const SwimStrokePairChart = () => (
    <div className="chart-card one">
      <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{L.swimStrokePair}</h4>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.swim.strokePair} margin={{ top: 16, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={numTick} />
            <Tooltip
              separator=""
              labelFormatter={(l)=> l}
              formatter={(v, key) => {
                const unitKey = key === 'total' ? 'totalStrokes' : 'avgStrokeRate'
                return [`${v}${UNITS[unitKey] || ''}`, key === 'total' ? 'Total' : (lang==='ko'?'평균':'Avg')]
              }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={10}
              wrapperStyle={{ top: 4, right: 4, fontSize: 12 }}
              formatter={(v)=> v==='total' ? (lang==='ko'?'총스트로크':'Total') : (lang==='ko'?'평균':'Avg')}
            />
            <Line type="monotone" name="total" dataKey="total" stroke={COLORS.mono} dot={{ r: 4 }} strokeWidth={2}/>
            <Line type="monotone" name="avg"   dataKey="rate"  stroke={COLORS.avg}  dot={{ r: 4 }} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const SwimSwolfChart = () => (
    <div className="chart-card one">
      <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{L.swimSwolfAvg}</h4>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.swim.swolf} margin={{ top: 12, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={numTick} />
            <Tooltip separator="" labelFormatter={(l)=> l} formatter={(v)=> [`${v}${UNITS.avgSwolf}`, '']} />
            <Line type="monotone" dataKey="val" stroke={COLORS.mono} dot={{ r: 4 }} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  // 사이클링 전용
  const BikeBRTripleChart = () => (
    <div className="chart-card one">
      <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{L.bikeBRTriple}</h4>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.bike.brTriple} margin={{ top: 20, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={numTick} />
            <Tooltip
              separator=""
              labelFormatter={(l)=> l}
              formatter={(v, key) => [`${v}${UNITS[key] || ' brpm'}`, ({
                avg: lang==='ko'?'평균':'Avg',
                min: lang==='ko'?'최저':'Min',
                max: lang==='ko'?'최대':'Max',
              })[key]]}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" iconSize={10}
              wrapperStyle={{ top: 4, right: 4, fontSize: 12 }}
              formatter={(v)=> ({avg: lang==='ko'?'평균':'Avg', min: lang==='ko'?'최저':'Min', max: lang==='ko'?'최대':'Max'})[v]}
            />
            {/* 평균=검정, 최저=파랑, 최대=빨강 */}
            <Line type="monotone" name="avg" dataKey="avg" stroke={COLORS.mono} dot={{ r: 4 }} strokeWidth={2}/>
            <Line type="monotone" name="min" dataKey="min" stroke={COLORS.avg}  dot={{ r: 4 }} strokeWidth={2}/>
            <Line type="monotone" name="max" dataKey="max" stroke={COLORS.max}  dot={{ r: 4 }} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const BikePedalStrokesChart = () => (
    <div className="chart-card one">
      <h4 className="chart-title" style={{ fontSize: 20, fontWeight: 800, margin: '6px 8px 4px' }}>{L.bikePedalStrokes}</h4>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.bike.pedalTotal} margin={{ top: 12, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={numTick} />
            <Tooltip separator="" labelFormatter={(l)=> l} formatter={(v)=> [`${v}${UNITS.totalPedalStrokes}`, '']} />
            <Line type="monotone" dataKey="val" stroke={COLORS.mono} dot={{ r: 4 }} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  return (
    <div>
      <div className="charts-stack">
        <DistanceChart />
        <PairChart id="chart-pace"  title={L.pacePair}  rows={data.pace}  yTick={paceTick} unitAvgKey="avgPace" unitMaxKey="maxPace" />
        <PairChart id="chart-hr"    title={L.hrPair}    rows={data.hr}    yTick={numTick} unitAvgKey="avgHR"   unitMaxKey="maxHR" />

        {/* ⬇️ 수영일 때 파워/케이던스 차트 제거 */}
        {sport !== 'swim' && (
          <>
            <PairChart id="chart-power" title={L.powerPair} rows={data.power} yTick={numTick} unitAvgKey="avgPower" unitMaxKey="maxPower" />
            <PairChart id="chart-cad"   title={L.cadPair}   rows={data.cad}   yTick={numTick} unitAvgKey="avgCad"   unitMaxKey="maxCad" />
          </>
        )}

        {sport === 'run' && <RunTabsChart />}

        {sport === 'swim' && (
          <>
            <SwimStrokePairChart />
            <SwimSwolfChart />
          </>
        )}

        {sport === 'bike' && (
          <>
            <BikeBRTripleChart />
            <BikePedalStrokesChart />
          </>
        )}
      </div>
    </div>
  )
}
