// src/components/EntryForm.jsx
import React, { useState } from 'react'
import { paceToSeconds, secondsToPace, toNum } from '../lib/utils.js'

/* 입력 필드 순서(요청 순서 고정) */
const ORDER = [
  'avgPace','maxPace',
  'avgHR','maxHR',
  'avgPower','maxPower',
  'avgCad','maxCad',
  'stride','gct','vRatio','vOsc'
]

const LABELS = {
  ko: {
    date: '날짜',
    dist: '거리 (km)',
    avgPace: '평균 페이스 (mm:ss)',
    maxPace: '최고 페이스 (mm:ss)',
    avgHR: '평균심박수 (bpm)',
    maxHR: '최대심박수 (bpm)',
    avgPower: '평균파워 (W)',
    maxPower: '최대파워 (W)',
    avgCad: '평균케이던스 (rpm)',
    maxCad: '최대케이던스 (rpm)',
    stride: '보행길이 (cm)',
    gct: '접지시간 (ms)',
    vRatio: '수직비율 (%)',
    vOsc: '수직진폭 (cm)',
    addRowSave: '행 추가(저장)',
    del: '삭제',
    noRows: '아직 추가된 기록이 없습니다.',
    pacePh: 'mm:ss'
  },
  en: {
    date: 'Date',
    dist: 'Distance (km)',
    avgPace: 'Avg Pace (mm:ss)',
    maxPace: 'Max Pace (mm:ss)',
    avgHR: 'Avg HR (bpm)',
    maxHR: 'Max HR (bpm)',
    avgPower: 'Avg Power (W)',
    maxPower: 'Max Power (W)',
    avgCad: 'Avg Cadence (rpm)',
    maxCad: 'Max Cadence (rpm)',
    stride: 'Stride Length (cm)',
    gct: 'Ground Contact Time (ms)',
    vRatio: 'Vertical Ratio (%)',
    vOsc: 'Vertical Oscillation (cm)',
    addRowSave: 'Add row (save)',
    del: 'Delete',
    noRows: 'No entries yet.',
    pacePh: 'mm:ss'
  }
}

const todayStr = () => new Date().toISOString().slice(0,10)

const EMPTY = () => ({
  date: todayStr(),      // 오늘 날짜 기본값
  dist: '',              // 거리(km)
  avgPace: '', maxPace: '',
  avgHR: '', maxHR: '',
  avgPower: '', maxPower: '',
  avgCad: '', maxCad: '',
  stride: '', gct: '', vRatio: '', vOsc: ''
})

export default function EntryForm({ entries, setEntries, lang='ko' }) {
  const L = LABELS[lang]
  const [row, setRow] = useState(EMPTY())

  const add = () => {
    if (!row.date) return alert(lang==='ko' ? '날짜를 입력하세요.' : 'Please input the date.')
    const e = {
      date: row.date,
      dist: toNum(row.dist),
      avgPace: paceToSeconds(row.avgPace),
      maxPace: paceToSeconds(row.maxPace),
      avgHR: toNum(row.avgHR),
      maxHR: toNum(row.maxHR),
      avgPower: toNum(row.avgPower),
      maxPower: toNum(row.maxPower),
      avgCad: toNum(row.avgCad),
      maxCad: toNum(row.maxCad),
      stride: toNum(row.stride),
      gct: toNum(row.gct),
      vRatio: toNum(row.vRatio),
      vOsc: toNum(row.vOsc)
    }
    setEntries([...entries, e].sort((a,b)=> new Date(a.date) - new Date(b.date)))
    setRow(EMPTY())
  }

  const remove = (i) => {
    const copy = entries.slice()
    copy.splice(i,1)
    setEntries(copy)
  }

  // 표 머리글(평균/최고 페이스)을 항상 2줄로 렌더링
  const renderPaceHeader = (type /* 'avg' | 'max' */) => {
    const first = lang === 'ko'
      ? (type === 'avg' ? '평균페이스' : '최고페이스')
      : (type === 'avg' ? 'Avg Pace'   : 'Max Pace')
    return (
      <span className="th-2line">
        <span>{first}</span><br/><span>(mm:ss)</span>
      </span>
    )
  }

  return (
    <>
      {/* 상단 2열: (좌) 날짜  (우) 거리 */}
      <div className="form-grid two" style={{marginBottom:12}}>
        <div>
          <label className="help">{L.date}</label>
          <input
            className="input" type="date"
            value={row.date}
            onChange={e=>setRow({...row, date: e.target.value})}
          />
        </div>
        <div>
          <label className="help">{L.dist}</label>
          <input
            className="input" type="number" step="any"
            value={row.dist}
            onChange={e=>setRow({...row, dist: e.target.value})}
          />
        </div>
      </div>

      {/* 나머지 항목 2열 */}
      <div className="form-grid auto">
        {ORDER.map(key => (
          <div key={key}>
            <label className="help">{L[key]}</label>
            <input
              className="input"
              type={['avgPace','maxPace'].includes(key) ? 'text' : 'number'}
              step={['avgPace','maxPace'].includes(key) ? undefined : 'any'}
              placeholder={['avgPace','maxPace'].includes(key) ? L.pacePh : ''}
              value={row[key]}
              onChange={(e)=>setRow({...row, [key]: e.target.value})}
            />
          </div>
        ))}
      </div>

      {/* 버튼 */}
      <div style={{ marginTop: 12, marginBottom: 40, display:'flex', justifyContent:'flex-end' }}>
        <button className="button primary" onClick={add}>{L.addRowSave}</button>
      </div>

      {/* 테이블 미리보기 */}
      <div className="table-wrap" style={{marginTop:28}}>
        <table className="table">
          <thead>
            <tr>
              <th>{L.date}</th>
              <th>{L.dist}</th>

              {/* ⬇️ 두 줄 고정 헤더 */}
              <th className="th-2line">{renderPaceHeader('avg')}</th>
              <th className="th-2line">{renderPaceHeader('max')}</th>

              <th>{L.avgHR}</th><th>{L.maxHR}</th>
              <th>{L.avgPower}</th><th>{L.maxPower}</th>
              <th>{L.avgCad}</th><th>{L.maxCad}</th>
              <th>{L.stride}</th><th>{L.gct}</th>
              <th>{L.vRatio}</th><th>{L.vOsc}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e,i)=>(
              <tr key={i}>
                <td>{e.date}</td>
                <td className="num">{e.dist ?? ''}</td>
                <td className="num">{secondsToPace(e.avgPace)}</td>
                <td className="num">{secondsToPace(e.maxPace)}</td>
                <td className="num">{e.avgHR ?? ''}</td>
                <td className="num">{e.maxHR ?? ''}</td>
                <td className="num">{e.avgPower ?? ''}</td>
                <td className="num">{e.maxPower ?? ''}</td>
                <td className="num">{e.avgCad ?? ''}</td>
                <td className="num">{e.maxCad ?? ''}</td>
                <td className="num">{e.stride ?? ''}</td>
                <td className="num">{e.gct ?? ''}</td>
                <td className="num">{e.vRatio ?? ''}</td>
                <td className="num">{e.vOsc ?? ''}</td>
                <td>
                  <button
                    className="button"
                    aria-label={L.del}
                    title={L.del}
                    onClick={()=>remove(i)}
                    style={{ padding:'6px 10px', lineHeight:1 }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {entries.length===0 && (
              <tr><td colSpan="15" className="help">{L.noRows}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
