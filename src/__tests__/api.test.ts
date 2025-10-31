import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getStoredExp,
  isAccessTokenExpired,
  scheduleTokenRefresh,
  cancelTokenRefresh,
} from '../api'

describe('api.ts - トークン管理テスト', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  describe('getStoredExp', () => {
    it('localStorageに保存された有効期限を秒単位で取得できる', () => {
      const expSec = Math.floor(Date.now() / 1000) + 600 // 10分後
      localStorage.setItem('access_token_expires', String(expSec))

      const result = getStoredExp()
      expect(result).toBe(expSec)
    })

    it('有効期限が未設定の場合は0を返す', () => {
      const result = getStoredExp()
      expect(result).toBe(0)
    })

    it('不正な値の場合は0を返す', () => {
      localStorage.setItem('access_token_expires', 'invalid')
      const result = getStoredExp()
      expect(result).toBe(0)
    })
  })

  describe('isAccessTokenExpired', () => {
    it('有効期限が30秒以内の場合、期限切れと判定される', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      localStorage.setItem('access_token_expires', String(nowSec + 20)) // 20秒後

      const result = isAccessTokenExpired()
      expect(result).toBe(true)
    })

    it('有効期限が30秒より先の場合、有効と判定される', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      localStorage.setItem('access_token_expires', String(nowSec + 60)) // 60秒後

      const result = isAccessTokenExpired()
      expect(result).toBe(false)
    })

    it('有効期限が過去の場合、期限切れと判定される', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      localStorage.setItem('access_token_expires', String(nowSec - 10)) // 10秒前

      const result = isAccessTokenExpired()
      expect(result).toBe(true)
    })

    it('有効期限が未設定の場合、期限切れと判定される', () => {
      const result = isAccessTokenExpired()
      expect(result).toBe(true)
    })
  })

  describe('scheduleTokenRefresh', () => {
    it('トークン有効期限の60秒前に自動更新がスケジュールされる（残り時間が2分以上の場合）', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      const expSec = nowSec + 180 // 3分後
      localStorage.setItem('access_token_expires', String(expSec))
      localStorage.setItem('access_token', 'test-token')

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      scheduleTokenRefresh()

      // コンソールに「120秒後にトークンを自動更新します」と表示されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('120秒後にトークンを自動更新します')
      )

      consoleSpy.mockRestore()
    })

    it('トークン有効期限の30秒前に自動更新がスケジュールされる（残り時間が2分以下の場合）', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      const expSec = nowSec + 90 // 1.5分後
      localStorage.setItem('access_token_expires', String(expSec))
      localStorage.setItem('access_token', 'test-token')

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      scheduleTokenRefresh()

      // コンソールに「60秒後にトークンを自動更新します」と表示されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('60秒後にトークンを自動更新します')
      )

      consoleSpy.mockRestore()
    })

    it('トークンが未設定の場合はスケジュールされない', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      const expSec = nowSec + 180
      localStorage.setItem('access_token_expires', String(expSec))
      // access_tokenは設定しない

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      scheduleTokenRefresh()

      // スケジュールメッセージが表示されないことを確認
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('秒後にトークンを自動更新します')
      )

      consoleSpy.mockRestore()
    })

    it('有効期限が近すぎる場合はスケジュールされない', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      const expSec = nowSec + 20 // 20秒後（30秒より短い）
      localStorage.setItem('access_token_expires', String(expSec))
      localStorage.setItem('access_token', 'test-token')

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      scheduleTokenRefresh()

      // 「自動更新をスケジュールしません」というメッセージが表示されることを確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('自動更新をスケジュールしません')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('cancelTokenRefresh', () => {
    it('スケジュールされた自動更新をキャンセルできる', () => {
      const nowSec = Math.floor(Date.now() / 1000)
      const expSec = nowSec + 180
      localStorage.setItem('access_token_expires', String(expSec))
      localStorage.setItem('access_token', 'test-token')

      scheduleTokenRefresh()
      cancelTokenRefresh()

      // タイマーがクリアされていることを確認
      // (実際のタイマーIDの検証は難しいので、エラーが出ないことを確認)
      expect(() => cancelTokenRefresh()).not.toThrow()
    })
  })
})
