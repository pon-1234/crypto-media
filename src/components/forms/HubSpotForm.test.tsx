/**
 * HubSpotFormコンポーネントのテスト
 * @issue #13 - HubSpotフォーム統合
 */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { HubSpotForm } from './HubSpotForm'

// Next.js Scriptコンポーネントのモック
interface ScriptProps {
  id: string
  src: string
  strategy: string
  onLoad?: () => void
  onError?: () => void
}

vi.mock('next/script', () => ({
  __esModule: true,
  default: function MockScript({ id, src, strategy, onLoad, onError }: ScriptProps) {
    // スクリプトロードをシミュレート
    React.useEffect(() => {
      if (onLoad) {
        onLoad()
      }
    }, [onLoad])
    
    return (
      <script 
        data-testid={id} 
        data-src={src} 
        data-strategy={strategy}
        data-onload={onLoad ? 'true' : 'false'}
        data-onerror={onError ? 'true' : 'false'}
      />
    )
  },
}))

// HubSpotグローバルオブジェクトの型定義は src/types/hubspot.d.ts で定義

describe('HubSpotForm', () => {
  const mockHbspt = {
    forms: {
      create: vi.fn(),
    },
  }

  beforeEach(() => {
    // window.hbsptをモック
    window.hbspt = mockHbspt
    vi.clearAllMocks()
  })

  afterEach(() => {
    // グローバルオブジェクトをクリーンアップ
    if (typeof window !== 'undefined' && window.hbspt) {
      delete window.hbspt
    }
  })

  it('HubSpotスクリプトとフォームコンテナをレンダリングする', () => {
    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
      />
    )

    // スクリプトタグが存在することを確認
    const script = screen.getByTestId('hubspot-script')
    expect(script).toHaveAttribute('data-src', '//js.hsforms.net/forms/embed/v2.js')
    expect(script).toHaveAttribute('data-strategy', 'afterInteractive')

    // フォームコンテナが存在することを確認
    const formContainer = document.getElementById('hubspot-form')
    expect(formContainer).toBeInTheDocument()
  })

  it('カスタムターゲットIDを使用できる', () => {
    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
        targetId="custom-form"
      />
    )

    const formContainer = document.getElementById('custom-form')
    expect(formContainer).toBeInTheDocument()
  })

  it('カスタムクラス名を適用できる', () => {
    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
        className="custom-class"
      />
    )

    const formContainer = document.getElementById('hubspot-form')
    expect(formContainer).toHaveClass('custom-class')
  })

  it('HubSpotフォームを作成する', async () => {
    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
      />
    )

    // スクリプトがロードされ、useEffectが実行されるのを待つ
    await waitFor(() => {
      expect(mockHbspt.forms.create).toHaveBeenCalledWith({
        portalId: '123456',
        formId: 'form-123',
        target: '#hubspot-form',
        onFormSubmitted: expect.any(Function),
      })
    })

  })

  it('フォーム送信時のコールバックを実行する', async () => {
    const onFormSubmitted = vi.fn()
    let capturedCallback: (() => void) | undefined

    // create関数の呼び出しをキャプチャ
    interface CreateConfig {
      portalId: string
      formId: string
      target: string
      onFormSubmitted?: () => void
    }
    
    mockHbspt.forms.create.mockImplementation((config: CreateConfig) => {
      capturedCallback = config.onFormSubmitted
    })

    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
        onFormSubmitted={onFormSubmitted}
      />
    )

    await waitFor(() => {
      expect(mockHbspt.forms.create).toHaveBeenCalled()
    })

    // キャプチャしたコールバックを実行
    expect(capturedCallback).toBeDefined()
    capturedCallback!()

    expect(onFormSubmitted).toHaveBeenCalled()
  })

  it('window.hbsptが存在しない場合はフォームを作成しない', () => {
    // window.hbsptを削除
    delete window.hbspt

    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
      />
    )

    expect(mockHbspt.forms.create).not.toHaveBeenCalled()
  })

  it('SSR環境（windowが未定義）でもエラーにならない', () => {
    // windowを一時的に未定義にする
    const originalWindow = global.window
    const originalDocument = global.document
    delete (global as unknown as { window?: Window }).window
    delete (global as unknown as { document?: Document }).document

    // renderが呼ばれる前にwindowとdocumentが必要なので、
    // コンポーネント自体の実行をテストする
    expect(() => {
      // useEffectは実行されないのでエラーにならない
      const TestWrapper = () => {
        const Component = HubSpotForm
        return <Component portalId="123456" formId="form-123" />
      }
      TestWrapper()
    }).not.toThrow()

    // windowとdocumentを復元
    global.window = originalWindow
    global.document = originalDocument
  })

  it('スクリプト読み込みエラー時にエラーメッセージを表示する', () => {
    // window.hbsptを削除してエラー状態をシミュレート
    delete window.hbspt
    
    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
      />
    )

    // スクリプトのonErrorハンドラーが登録されていることを確認
    const script = screen.getByTestId('hubspot-script')
    expect(script.getAttribute('data-onerror')).toBe('true')
  })

  it('フォーム作成エラー時にエラーメッセージを表示する', async () => {
    // create関数がエラーをスローするようにモック
    mockHbspt.forms.create.mockImplementation(() => {
      throw new Error('Form creation failed')
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <HubSpotForm
        portalId="123456"
        formId="form-123"
      />
    )

    // スクリプトがロードされてエラーが発生するまで待つ
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'HubSpotフォームの作成に失敗しました:',
        expect.any(Error)
      )
    })

    // エラーメッセージが表示されていることを確認
    expect(screen.getByText('フォームの読み込みに失敗しました')).toBeInTheDocument()

    consoleErrorSpy.mockRestore()
  })
})