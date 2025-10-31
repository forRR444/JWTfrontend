import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MealForm } from '../components/meals/MealForm'

// searchFoodsのモック
vi.mock('../api', () => ({
  searchFoods: vi.fn((query: string) => {
    if (query === 'おにぎり') {
      return Promise.resolve({
        foods: [
          {
            id: 1,
            name: '鮭おにぎり',
            calories: 180,
            protein: 4.5,
            fat: 1.2,
            carbohydrate: 38,
          },
        ],
      })
    }
    return Promise.resolve({ foods: [] })
  }),
}))

describe('MealForm', () => {
  const mockOnSubmit = vi.fn()
  const selectedDate = '2025-10-26'

  it('フォームが正しくレンダリングされる', () => {
    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText('食事内容')).toBeInTheDocument()
    expect(screen.getByLabelText('食事のタイミング')).toBeInTheDocument()
    expect(screen.getByLabelText('カロリー (kcal)')).toBeInTheDocument()
    expect(screen.getByText('追加')).toBeInTheDocument()
  })

  it('食事内容が必須項目である', async () => {
    const user = userEvent.setup()
    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByText('追加')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('食事内容は必須です')).toBeInTheDocument()
    })

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('食事内容を入力して送信できる', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'ラーメン')

    const submitButton = screen.getByText('追加')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        content: 'ラーメン',
        meal_type: 'other',
        calories: undefined,
        grams: undefined,
        protein: undefined,
        fat: undefined,
        carbohydrate: undefined,
        tags: [],
        eaten_on: selectedDate,
      })
    })
  })

  it('食事のタイミングを選択できる', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'ラーメン')

    const mealTypeSelect = screen.getByLabelText('食事のタイミング')
    await user.selectOptions(mealTypeSelect, 'lunch')

    const submitButton = screen.getByText('追加')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'ラーメン',
          meal_type: 'lunch',
        })
      )
    })
  })

  it('カロリーを入力できる', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'ラーメン')

    const caloriesInput = screen.getByLabelText('カロリー (kcal)')
    await user.type(caloriesInput, '500')

    const submitButton = screen.getByText('追加')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'ラーメン',
          calories: 500,
        })
      )
    })
  })

  it('詳細入力を開閉できる', async () => {
    const user = userEvent.setup()
    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    // 初期状態では詳細入力は非表示
    expect(screen.queryByLabelText('グラム数 (g)')).not.toBeInTheDocument()

    // 詳細を入力ボタンをクリック
    const toggleButton = screen.getByText('詳細を入力')
    await user.click(toggleButton)

    // 詳細入力が表示される
    await waitFor(() => {
      expect(screen.getByLabelText('グラム数 (g)')).toBeInTheDocument()
      expect(screen.getByLabelText('タンパク質 (g)')).toBeInTheDocument()
      expect(screen.getByLabelText('脂質 (g)')).toBeInTheDocument()
      expect(screen.getByLabelText('炭水化物 (g)')).toBeInTheDocument()
    })

    // もう一度クリックすると閉じる
    const closeButton = screen.getByText('詳細を閉じる')
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByLabelText('グラム数 (g)')).not.toBeInTheDocument()
    })
  })

  it('食品検索ができる', async () => {
    const user = userEvent.setup()
    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'おにぎり')

    const searchButton = screen.getByText('検索')
    await user.click(searchButton)

    // 検索結果が表示される
    await waitFor(() => {
      expect(screen.getByText('鮭おにぎり')).toBeInTheDocument()
      expect(screen.getByText(/180kcal/)).toBeInTheDocument()
    })
  })

  it('検索結果から食品を選択できる', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'おにぎり')

    const searchButton = screen.getByText('検索')
    await user.click(searchButton)

    // 検索結果が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('鮭おにぎり')).toBeInTheDocument()
    })

    // 検索結果をクリック
    const resultItem = screen.getByText('鮭おにぎり')
    await user.click(resultItem)

    // フォームに値が反映される
    await waitFor(() => {
      expect(contentInput).toHaveValue('鮭おにぎり')
    })

    // 詳細が自動的に表示される
    await waitFor(() => {
      expect(screen.getByLabelText('グラム数 (g)')).toBeInTheDocument()
    })
  })

  it('入力内容をクリアできる', async () => {
    const user = userEvent.setup()
    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'ラーメン')

    // クリアボタンが表示される
    const clearButton = screen.getByLabelText('入力をクリア')
    await user.click(clearButton)

    // 入力がクリアされる
    await waitFor(() => {
      expect(contentInput).toHaveValue('')
    })
  })

  it('送信成功後にフォームがリセットされる', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockResolvedValue(undefined)

    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'ラーメン')

    const caloriesInput = screen.getByLabelText('カロリー (kcal)')
    await user.type(caloriesInput, '500')

    const submitButton = screen.getByText('追加')
    await user.click(submitButton)

    // 送信後、フォームがリセットされる
    await waitFor(() => {
      expect(contentInput).toHaveValue('')
      expect(caloriesInput).toHaveValue(null)
    })
  })

  it('送信エラー時にエラーメッセージが表示される', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockRejectedValue(new Error('サーバーエラー'))

    render(<MealForm selectedDate={selectedDate} onSubmit={mockOnSubmit} />)

    const contentInput = screen.getByLabelText('食事内容')
    await user.type(contentInput, 'ラーメン')

    const submitButton = screen.getByText('追加')
    await user.click(submitButton)

    // エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText(/サーバーエラー|作成に失敗しました/)).toBeInTheDocument()
    })
  })
})
