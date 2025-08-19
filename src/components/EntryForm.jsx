// src/components/EntryForm.jsx
import React, { useState, useMemo } from 'react'
import { paceToSeconds, secondsToPace, toNum } from '../lib/utils.js'

/** 스포츠별 필드 정의 */
const FIELDS_BY_SPORT = {
  run: {
    order: [
      'avgPace','maxPace',
      'avgHR','maxHR',
      'avgPower','maxPower',
      'avgCad','maxCad',
      'stride','gct','vRatio','vOsc'
    ],
    labels: {
      ko: {
        date: '날짜',
        dist: '거리 (km)',
        avgPace: '평균 페이스 (mm:ss)',
        maxPace: '최대 페이스 (mm:ss)',
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
  },
  swim: {
    // ⬇️ 요청: 파워/케이던스 제거
    order: [
      'avgPace','maxPace',
      'avgHR','maxHR',
      'totalStrokes','avgStrokeRate','avgSwolf'
    ],
    labels: {
      ko: {
        date: '날짜',
        dist: '거리 (km)',
        avgPace: '평균 페이스 (mm:ss)',
        maxPace: '최대 페이스 (mm:ss)',
        avgHR: '평균심박수 (bpm)',
        maxHR: '최대심박수 (bpm)',
        totalStrokes: '총스트로크 횟수 (개)',
        avgStrokeRate: '평균 스트로크율 (spm)',
        avgSwolf: '평균 Swolf',
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
        totalStrokes: 'Total Strokes (count)',
        avgStrokeRate: 'Avg Stroke Rate (spm)',
        avgSwolf: 'Avg Swolf',
        addRowSave: 'Add row (save)',
        del: 'Delete',
        noRows: 'No entries yet.',
        pacePh: 'mm:ss'
      }
    }
  },
  bike: {
    order: [
      'avgPace','maxPace',
      'avgHR','maxHR',
      'avgPower','maxPower',
      'avgCad','maxCad',
      'avgBR','minBR','maxBR','totalPedalStrokes'
    ],
    labels: {
      ko: {
        date: '날짜',
        dist: '거리 (km)',
        avgPace: '평균 페이스 (mm:ss)',
        maxPace: '최대 페이스 (mm:ss)',
        avgHR: '평균심박수 (bpm)',
        maxHR: '최대심박수 (bpm)',
        avgPower: '평균파워 (W)',
        maxPower: '최대파워 (W)',
        avgCad: '평균케이던스 (rpm)',
        maxCad: '최대케이던스 (rpm)',
        avgBR: '평균 호흡 속도 (brpm)',
        minBR: '최저 호흡 속도 (brpm)',
        maxBR: '최대 호흡 속도 (brpm)',
        totalPedalStrokes: '총 페달 스트로크 (개)',
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
        avgBR: 'Avg Breathing Rate (brpm)',
        minBR: 'Min Breathing Rate (brpm)',
        maxBR: 'Max Breathing Rate (brpm)',
        totalPedalStrokes: 'Total Pedal Strokes (count)',
        addRowSave: 'Add row (save)',
        del: 'Delete',
        noRows: 'No entries yet.',
        pacePh: 'mm:ss'
      }
    }
  }
}

const todayStr = () => new Date().toISOString().slice(0,10)

const EMPTY = () => ({
  date: todayStr(),
  dist: '',
  avgPace: '', maxPace: '',
  avgHR: '', maxHR: '',
  avgPower: '', maxPower: '',
  avgCad: '', maxCad: '',
  // run 전용
  stride: '', gct: '', vRatio: '', vOsc: '',
  // swim 전용
  totalStrokes: '', avgStrokeRate: '', avgSwolf: '',
  // bike 전용
  avgBR: '', minBR: '', maxBR: '', totalPedalStrokes: ''
})

/** 페이스 인풋 포맷터: onBlur 때만 적용 */
function normalizePaceText(v) {
  if (v == null) return ''
  const s = String(v).trim()
  if (!s) return ''
  if (s.includes(':')) {
    const [mmRaw, ssRaw=''] = s.split(':')
    const mm = mmRaw.replace(/\D/g,'')
    let ss = ssRaw.replace(/\D/g,'')
    if (ss.length === 0) ss = '00'
    else if (ss.length === 1) ss = ss + '0'
    return mm ? `${mm}:${ss}` : ''
  }
  const d = s.replace(/\D/g,'')
  if (!d) return ''
  if (d.length === 1) return `${d}:00`
  if (d.length === 2) return `${d}:00`
  if (d.length === 3) return `${d.slice(0,2)}:${d.slice(2)}0`
  return `${d.slice(0,-2)}:${d.slice(-2)}`
}

export default function EntryForm({ entries, setEntries, lang='ko', sport='run' }) {
  const cfg = FIELDS_BY_SPORT[sport] || FIELDS_BY_SPORT.run
  const ORDER = cfg.order
  const LABELS = useMemo(() => cfg.labels[lang] || cfg.labels.ko, [cfg, lang])

  const [row, setRow] = useState(EMPTY())

  const add = () => {
    if (!row.date) return alert(lang==='ko' ? '날짜를 입력하세요.' : 'Please input the date.')
    const e = {
      date: row.date,
      dist: toNum(row.dist),

      // 공통
      avgPace: paceToSeconds(normalizePaceText(row.avgPace)),
      maxPace: paceToSeconds(normalizePaceText(row.maxPace)),
      avgHR: toNum(row.avgHR), maxHR: toNum(row.maxHR),
      avgPower: toNum(row.avgPower), maxPower: toNum(row.maxPower),
      avgCad: toNum(row.avgCad), maxCad: toNum(row.maxCad),

      // run
      stride: toNum(row.stride), gct: toNum(row.gct),
      vRatio: toNum(row.vRatio), vOsc: toNum(row.vOsc),

      // swim
      totalStrokes: toNum(row.totalStrokes),
      avgStrokeRate: toNum(row.avgStrokeRate),
      avgSwolf: toNum(row.avgSwolf),

      // bike
      avgBR: toNum(row.avgBR),
      minBR: toNum(row.minBR),
      maxBR: toNum(row.maxBR),
      totalPedalStrokes: toNum(row.totalPedalStrokes),
    }
    setEntries([...entries, e].sort((a,b)=> new Date(a.date) - new Date(b.date)))
    setRow(EMPTY())
  }

  const remove = (i) => {
    const copy = entries.slice()
    copy.splice(i,1)
    setEntries(copy)
  }

  const renderPaceHeader = (type /* 'avg' | 'max' */) => {
    const first = (lang === 'ko')
      ? (type === 'avg' ? '평균페이스' : '최대페이스')
      : (type === 'avg' ? 'Avg Pace' : 'Max Pace')
    return (
      <span className="th-2line">
        <span>{first}</span><br/><span>(mm:ss)</span>
      </span>
    )
  }

  const onChange = (key) => (e) => setRow({ ...row, [key]: e.target.value })
  const onBlur = (key) => (e) => {
    if (key === 'avgPace' || key === 'maxPace') {
      setRow({ ...row, [key]: normalizePaceText(e.target.value) })
    }
  }

  return (
    <>
      {/* 상단 2열: 날짜 / 거리 */}
      <div className="form-grid two" style={{marginBottom:12}}>
        <div>
          <label className="help">{LABELS.date}</label>
          <input className="input" type="date" value={row.date} onChange={onChange('date')} />
        </div>
        <div>
          <label className="help">{LABELS.dist}</label>
          <input className="input" type="number" step="any" value={row.dist} onChange={onChange('dist')} />
        </div>
      </div>

      {/* 나머지 항목 2열 */}
      <div className="form-grid auto">
        {ORDER.map(key => (
          <div key={key}>
            <label className="help">{LABELS[key]}</label>
            <input
              className="input"
              type={['avgPace','maxPace'].includes(key) ? 'text' : 'number'}
              step={['avgPace','maxPace'].includes(key) ? undefined : 'any'}
              placeholder={['avgPace','maxPace'].includes(key) ? LABELS.pacePh : ''}
              value={row[key]}
              onChange={onChange(key)}
              onBlur={onBlur(key)}
            />
          </div>
        ))}
      </div>

      {/* 버튼 */}
      <div style={{ marginTop: 12, marginBottom: 40, display:'flex', justifyContent:'flex-end' }}>
        <button className="button primary" onClick={add}>{LABELS.addRowSave}</button>
      </div>

      {/* 미리보기 테이블 */}
      <div className="table-wrap" style={{marginTop:28}}>
        <table className="table">
          <thead>
            <tr>
              <th>{LABELS.date}</th>
              <th>{LABELS.dist}</th>
              <th className="th-2line">{renderPaceHeader('avg')}</th>
              <th className="th-2line">{renderPaceHeader('max')}</th>
              {ORDER.filter(k => !['avgPace','maxPace'].includes(k)).map(k => (
                <th key={`h-${k}`}>{LABELS[k]}</th>
              ))}
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
                {ORDER.filter(k => !['avgPace','maxPace'].includes(k)).map(k => (
                  <td className="num" key={`c-${k}-${i}`}>{e[k] ?? ''}</td>
                ))}
                <td>
                  <button
                    className="button"
                    aria-label={LABELS.del}
                    title={LABELS.del}
                    onClick={()=>remove(i)}
                    style={{ padding:'6px 10px', lineHeight:1 }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {entries.length===0 && (
              <tr><td colSpan={2 + 2 + ORDER.length} className="help">{LABELS.noRows}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
