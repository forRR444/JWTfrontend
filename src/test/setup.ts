import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// 各テスト後にクリーンアップ
afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

// グローバルなモック設定
globalThis.alert = vi.fn()
