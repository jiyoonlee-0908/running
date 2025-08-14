// 숫자 문자열을 number로 안전하게 변환 (빈값/NaN이면 null)
export function toNum(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/,/g, '').trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// 페이스("5:30" 또는 5.5(분)) -> 초
export function paceToSeconds(pace) {
  if (pace === null || pace === undefined) return null;
  const s = String(pace).trim();
  if (s === '') return null;

  // "분:초"
  if (s.includes(':')) {
    const parts = s.split(':').map((x) => Number(x));
    if (parts.length === 2) {
      const [m, sec] = parts;
      if (!Number.isFinite(m) || !Number.isFinite(sec)) return null;
      return m * 60 + sec;
    }
    if (parts.length === 3) {
      const [h, m, sec] = parts;
      if (![h, m, sec].every(Number.isFinite)) return null;
      return h * 3600 + m * 60 + sec;
    }
    return null;
  }

  // 소수 분(예: 5.5분 = 5분 30초)
  const f = Number(s);
  if (!Number.isFinite(f)) return null;
  const m = Math.trunc(f);
  const sec = (f - m) * 60;
  return m * 60 + sec;
}

// 초 -> "mm:ss"
export function secondsToPace(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 거리(km)와 시간(초)로 페이스 계산
export function calculatePace(distance, timeInSeconds) {
  if (!Number.isFinite(distance) || !Number.isFinite(timeInSeconds) || distance <= 0) return '';
  const paceInSeconds = timeInSeconds / distance;
  return secondsToPace(paceInSeconds);
}

// 초 -> "HH:MM:SS"
export function formatTime(timeInSeconds) {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) return '00:00:00';
  const h = Math.floor(timeInSeconds / 3600);
  const m = Math.floor((timeInSeconds % 3600) / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
