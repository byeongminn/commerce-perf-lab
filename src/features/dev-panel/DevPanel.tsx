'use client'

import { useState } from 'react'

import { mockSettings } from '@/lib/api'

// 화면 왼쪽 아래의 지연 · 실패 설정 패널 (낙관적 업데이트 롤백 재현용)
export function DevPanel() {
  const [delay, setDelay] = useState(mockSettings.delay)
  const [fail, setFail] = useState(mockSettings.fail)

  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-3 rounded-lg border bg-white p-3 text-sm shadow-lg">
      <label className="flex items-center gap-1">
        지연
        <select
          className="rounded border px-1"
          value={delay}
          onChange={(e) => {
            const value = Number(e.target.value)
            mockSettings.delay = value
            setDelay(value)
          }}
        >
          {[0, 300, 1000, 3000].map((ms) => (
            <option key={ms} value={ms}>
              {ms}ms
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1">
        실패율
        <select
          className="rounded border px-1"
          value={fail}
          onChange={(e) => {
            const value = Number(e.target.value)
            mockSettings.fail = value
            setFail(value)
          }}
        >
          {[0, 0.3, 0.5, 1].map((rate) => (
            <option key={rate} value={rate}>
              {rate * 100}%
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
