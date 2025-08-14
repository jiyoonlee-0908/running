import React, { useState } from 'react'
import { paceToSeconds, secondsToPace, toNum } from '../lib/utils.js'

/* 입력 필드 순서(요청 순서 고정) */
const ORDER = [
  'avgPace', 'maxPace',
  'avgHR', 'maxHR',
  'avgPower', 'maxPower',
  'avgCad', 'maxCad',
  'stride', 'gct',
  'vRatio', 'vOsc'
]

const LABELS = {
  en: {
    name: 'Name', date: 'Date',
    avgPace: 'Avg Pace (mm:ss)', maxPace: 'Max Pace (mm:ss)',
    avgHR: 'Avg HR (bpm)', maxHR: 'Max HR (bpm)',
    avgPower: 'Avg Power (W)', maxPower: 'Max Power (W)',
    avgCad: 'Avg Cadence (rpm)', maxCad: 'Max Cadence (rpm)',
    stride: 'Stride Length (cm)', gct: 'Ground Contact Time (ms)',
    vRatio: 'Vertical Ratio (%)', vOsc: 'Vertical Oscillation (cm)',
    addRowSave: 'Add row (save)', del: 'Delete',
    pacePh: 'e.g. 5:20', noRows: 'No entries yet.'
  },
  ko: {
    name: '이름', date: '날짜',
    avgPace: '평균 페이스 (mm:ss)', maxPace: '최고 페이스 (mm:ss)',
    avgHR: '평균심박수 (bpm)', maxHR: '최대심박수 (bpm)',
    avgPower: '평균파워 (W)', maxPower: '최대파워 (W)',
    avgCad: '평균케이던스 (rpm)', maxCad: '최대케이던스 (rpm)',
    stride: '보행길이 (cm)', gct: '접지시간 (ms)',
    vRatio: '수직비율 (%)', vOsc: '수직진폭 (cm)',
    addRowSave: '행 추가(저장)', del: '삭제',
    pacePh: '예: 5:20', noRows: '아직 추가된 기록이 없습니다.'
  }
}

const todayStr = () => new Date().toISOString().slice(0,10)

const EMPTY = () => ({
  date: todayStr(),       // 오늘 날짜 기본값
  avgPace: '', maxPace: '',
  avgHR: '', maxHR: '',
  avgPower: '', maxPower: '',
  avgCad: '', maxCad: '',
  stride: '', gct: '', vRatio: '', vOsc: ''
})

export default function EntryForm({ name, setName, entries, setEntries, lang = 'en' }) {
  const L = LABELS[lang]
  const [row, setRow] = useState(EMPTY())

  const add = () => {
    if (!row.date) return alert(lang==='en'?'Please input the date.':'날짜를 입력하세요.')
    const e = {
      date: row.date,
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
    setEntries([...entries, e].sort((a,b)=>new Date(a.date)-new Date(b.date)))
    setRow(EMPTY()) // 다음 입력도 오늘 날짜 기본값
  }

  const remove = (i) => {
    const copy = entries.slice()
    copy.splice(i,1)
    setEntries(copy)
  }

  return (
    <>
      {/* 이름 + 날짜 한 줄 */}
      <div className="form-grid two" style={{marginBottom:12}}>
        <div>
          <label className="help">{L.name}</label>
          <input
            className="input"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder={lang==='en'?'Your name':'이름을 입력하세요'}
          />
        </div>
        <div>
          <label className="help">{L.date}</label>
          <input
            className="input"
            type="date"
            value={row.date}
            onChange={e=>setRow({...row, date: e.target.value})}
          />
        </div>
      </div>

      {/* 항목들 2열 */}
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

      {/* 버튼: 오른쪽 정렬, '행 추가(저장)'만 표시 */}
      <div style={{marginTop:12, display:'flex', justifyContent:'flex-end'}}>
        <button className="button primary" onClick={add}>{L.addRowSave}</button>
      </div>

      {/* 미리보기 테이블 */}
      <div className="table-wrap" style={{marginTop:16}}>
        <table className="table">
          <thead>
            <tr>
              <th>{L.date}</th>
              <th>{L.avgPace}</th><th>{L.maxPace}</th>
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
                <td><button className="button" onClick={()=>remove(i)}>{L.del}</button></td>
              </tr>
            ))}
            {entries.length===0 && <tr><td colSpan="14" className="help">{L.noRows}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
