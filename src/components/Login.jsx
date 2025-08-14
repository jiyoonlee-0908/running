import React from 'react'
import { auth, googleProvider } from '../lib/firebase.js'
import { signInWithPopup } from 'firebase/auth'

export default function Login({ onLogin }) {
  const handleGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      onLogin(result.user)
    } catch (e) {
      alert('로그인 실패: ' + (e?.message || e))
    }
  }

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h3 style={{ marginTop: 0 }}>Google 계정으로 로그인</h3>
      <button className="button primary" onClick={handleGoogle}>Google로 계속</button>
      <p className="help" style={{ marginTop: 8 }}>이 앱은 Google 로그인만 허용합니다.</p>
    </div>
  )
}
