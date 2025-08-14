import React, { useMemo, useState } from 'react'
import { paceToSeconds, secondsToPace, toNum } from '../lib/utils.js'

const FIELDS = [
  { key: 'date', label: '날짜', type: 'date' },
  { key: 'avgPace', label: '평균 페이스 (mm:ss)', type: 'pace' },
  { key: 'maxPace', label: '최고 페이스 (mm:ss)', type: 'pace' },
  { key: 'avgHR', label: '평균심박수 (bpm)', type: 'number' },
  { key: 'maxHR', label: '최대심박수 (bpm)', type: 'number' },
  { key: 'avgPower', label: '평균파워 (W)', type: 'number' },
  { key: 'maxPower', label: '최대파워 (W)', type: 'number' },
  { key: 'avgCad', label: '평균케이던스 (rpm)', type: 'number' },
  { key: 'maxCad', label: '최대케이던스 (rpm)', type: 'number' },
  { key: 'stride', label: '보행길이 (cm)', type: 'number' },
  { key: 'vRatio', label: '수직비율 (%)', type: 'number' },
  { key: 'vOsc', label: '수직진폭 (cm)', type: 'number' },
  { key: 'gct', label: '접지시간 (ms)', type: 'number' }
]

const EMPTY = () => ({
  date: '',
  avgPace: '', maxPace: '',
  avgHR: '', maxHR: '',
  avgPower: '', maxPower: '',
  avgCad: '', maxCad: '',
  stride: '', vRatio: '', vOsc: '', gct: ''
})

export default function EntryForm({ entries, setEntries }) {
  const [row, setRow] = useState(EMPTY())

  const add = () => {
    if (!row.date) return alert('날짜를 입력하세요.')
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
      vRatio: toNum(row.vRatio),
      vOsc: toNum(row.vOsc),
      gct: toNum(row.gct)
    }
    setEntries([...entries, e].sort((a,b)=>new Date(a.date)-new Date(b.date)))
    setRow(EMPTY())
  }

  const remove = (i) => {
    const copy = entries.slice()
    copy.splice(i,1)
    setEntries(copy)
  }

  return (
    <>
      <div className="row">
        {FIELDS.map(f => (
          <div className="col" key={f.key}>
            <label className="help">{f.label}</label>
            <input
              className="input"
              type={f.type==='date' ? 'date' : 'text'}
              value={row[f.key]}
              placeholder={f.type==='pace' ? '예: 5:20' : ''}
              onChange={(e)=>setRow({...row, [f.key]: e.target.value})}
            />
          </div>
        ))}
      </div>
      <div style={{marginTop:10}}>
        <button className="button" onClick={()=>setRow(EMPTY())}>입력값 지우기</button>
        <button className="button primary" style={{marginLeft:8}} onClick={add}>행 추가</button>
      </div>

      <div style={{marginTop:16}}>
        <table className="table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>평균페이스</th><th>최고페이스</th>
              <th>평균심박</th><th>최대심박</th>
              <th>평균파워</th><th>최대파워</th>
              <th>평균케이던스</th><th>최대케이던스</th>
              <th>보행길이</th><th>수직비율</th><th>수직진폭</th><th>접지시간</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e,i)=>(
              <tr key={i}>
                <td>{e.date}</td>
                <td>{secondsToPace(e.avgPace)}</td>
                <td>{secondsToPace(e.maxPace)}</td>
                <td>{e.avgHR ?? ''}</td>
                <td>{e.maxHR ?? ''}</td>
                <td>{e.avgPower ?? ''}</td>
                <td>{e.maxPower ?? ''}</td>
                <td>{e.avgCad ?? ''}</td>
                <td>{e.maxCad ?? ''}</td>
                <td>{e.stride ?? ''}</td>
                <td>{e.vRatio ?? ''}</td>
                <td>{e.vOsc ?? ''}</td>
                <td>{e.gct ?? ''}</td>
                <td><button className="button" onClick={()=>remove(i)}>삭제</button></td>
              </tr>
            ))}
            {entries.length===0 && <tr><td colSpan="14" className="help">아직 추가된 기록이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}
