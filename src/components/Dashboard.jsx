import React, { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend
} from 'recharts'
import { secondsToPace } from '../lib/utils.js'

/* 라벨 */
const LABEL = {
  ko: {
    distance: '거리',
    pace: '평균·최고 페이스',
    hr: '평균·최대 심박수',
    power: '평균·최대 파워',
    cad: '평균·최대 케이던스',
    tabsTitle: '보행길이·접지시간·수직비율·수직진폭',
    avg: '평균',
    max: '최대',
    stride: '보행길이',
    gct: '접지시간',
    vRatio: '수직비율',
    vOsc: '수직진폭'
  },
  en: {
    distance: 'Distance',
    pace: 'Avg·Max Pace',
    hr: 'Avg·Max Heart Rate',
    power: 'Avg·Max Power',
    cad: 'Avg·Max Cadence',
    tabsTitle: 'Stride·GCT·Vertical Ratio·Vertical Oscillation',
    avg: 'Avg',
    max: 'Max',
    stride: 'Stride',
    gct: 'Ground Contact',
    vRatio: 'Vertical Ratio',
    vOsc: 'Vertical Osc.'
  }
}

/* 유틸 포맷터 */
const paceTick = (v)=> secondsToPace(Number(v) || 0)
const numTick  = (v)=> (v ?? '') // 단순 숫자
const byTypeTick = (type)=>(type==='pace' ? paceTick : numTick)

/* 공용 툴팁 포맷터 */
const tooltipFormatter = (metricType, lang)=>(value, name) => {
  const vv = metricType==='pace' ? secondsToPace(value) : value
  const label = (name==='avg')
    ? (lang==='ko' ? LABEL.ko.avg : LABEL.en.avg)
    : (lang==='ko' ? LABEL.ko.max : LABEL.en.max)
  return [vv, label]
}

/* 2-선(평균/최대) 공용 차트 */
function DualLineCard({ title, data, metricType='number', lang='ko' }) {
  const yTickFormatter = byTypeTick(metricType)

  return (
    <div className="chart-card one">
      <div className="chart-title">{title}</div>
      <div className="chart" style={{ paddingTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 14, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={yTickFormatter} />
            <Tooltip
              formatter={tooltipFormatter(metricType, lang)}
              labelFormatter={(l)=> l}
            />
            {/* 범례: 작게, 그래프 위에 살짝 */}
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ top: 4, right: 6, fontSize: 12, lineHeight: '12px' }}
              formatter={(v)=> v==='avg'
                ? (lang==='ko'?LABEL.ko.avg:LABEL.en.avg)
                : (lang==='ko'?LABEL.ko.max:LABEL.en.max)
              }
            />
            <Line type="monotone" dataKey="avg" stroke="#1d4ed8" dot strokeWidth={2}/>
            <Line type="monotone" dataKey="max" stroke="#ef4444" dot strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* 단일 라인 카드(거리 등) */
function SingleLineCard({ title, data, color='#111827', yTick=numTick }) {
  return (
    <div className="chart-card one">
      <div className="chart-title">{title}</div>
      <div className="chart" style={{ paddingTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={yTick} />
            <Tooltip labelFormatter={(l)=> l}/>
            <Line type="monotone" dataKey="val" stroke={color} dot strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function Dashboard({ entries = [], lang='ko' }) {
  const L = LABEL[lang]

  // 날짜 순 정렬
  const sorted = useMemo(() => {
    const copy = (entries || []).slice()
    copy.sort((a,b)=> new Date(a.date) - new Date(b.date))
    return copy
  }, [entries])

  // 데이터 변환
  const mkDual = (avgKey, maxKey) =>
    sorted.map(e=>({ date: e.date, avg: e?.[avgKey] ?? null, max: e?.[maxKey] ?? null }))

  const mkSingle = (key) =>
    sorted.map(e=>({ date: e.date, val: e?.[key] ?? null }))

  // 시리즈
  const paceData  = mkDual('avgPace', 'maxPace')     // pace(초) → mm:ss
  const hrData    = mkDual('avgHR', 'maxHR')
  const powData   = mkDual('avgPower', 'maxPower')
  const cadData   = mkDual('avgCad', 'maxCad')

  const strideData = mkSingle('stride')
  const gctData    = mkSingle('gct')
  const vRatioData = mkSingle('vRatio')
  const vOscData   = mkSingle('vOsc')

  const distanceData = mkSingle('distance')
  const hasDistance = distanceData.some(d => d.val != null)

  // 탭
  const [active, setActive] = useState('stride')
  const TAB_LABEL = {
    stride: L.stride,
    gct: L.gct,
    vRatio: L.vRatio,
    vOsc: L.vOsc
  }

    // EN만 살짝 더 작고 압축된 타이포 적용 (KO는 기존과 동일)
  const tabFontSize = lang === 'en' ? 18 : 20
  const tabLineHeight = lang === 'en' ? 1.1 : 1.2
  const tabGap = lang === 'en' ? 22 : 24
  
  const tabData = {
    stride: { data: strideData, yTick: numTick, color:'#111827' },
    gct:    { data: gctData,    yTick: numTick, color:'#111827' },
    vRatio: { data: vRatioData, yTick: numTick, color:'#111827' },
    vOsc:   { data: vOscData,   yTick: numTick, color:'#111827' }
  }

  return (
    <div className="charts-stack">

      {/* 거리(데이터가 있는 경우에만 표시) */}
      {hasDistance && (
        <SingleLineCard title={L.distance} data={distanceData} color="#0f766e" yTick={numTick} />
      )}

      {/* 평균/최대 4종 */}
      <DualLineCard title={L.pace}  data={paceData}  metricType="pace"  lang={lang}/>
      <DualLineCard title={L.hr}    data={hrData}    metricType="number"  lang={lang}/>
      <DualLineCard title={L.power} data={powData}   metricType="number"  lang={lang}/>
      <DualLineCard title={L.cad}   data={cadData}   metricType="number"  lang={lang}/>

      {/* 탭: 보행길이/접지시간/수직비율/수직진폭 */}
      <div className="chart-card one">
        {/* 탭 헤더(제목처럼 보이게, 밑 가로줄은 없음 / 활성 탭만 밑줄) */}
        <div style={{ display:'flex', gap:24, alignItems:'flex-end', margin:'0 8px 8px' }}>
          {Object.keys(TAB_LABEL).map(k => (
            <button
              key={k}
              onClick={()=>setActive(k)}
              style={{
                border:'none',
                background:'transparent',
                padding:'2px 0 6px',
                cursor:'pointer',
                fontSize:18,
                fontWeight: active===k? 800 : 700,
                color: active===k? '#111827' : '#6b7280',
                borderBottom: active===k ? '3px solid #111827' : '3px solid transparent'
              }}
            >
              {TAB_LABEL[k]}
            </button>
          ))}
        </div>

        {/* 선택된 탭 차트 */}
        <div className="chart" style={{ paddingTop: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tabData[active].data} margin={{ top: 8, right: 16, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={tabData[active].yTick} />
              <Tooltip labelFormatter={(l)=> l} formatter={(v) => [tabData[active].yTick ? tabData[active].yTick(v) : v, '']}/>
              <Line type="monotone" dataKey="val" name="" stroke={tabData[active].color} dot strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
