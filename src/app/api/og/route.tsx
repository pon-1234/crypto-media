import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * 動的OGP画像を生成するAPIエンドポイント
 * @doc https://vercel.com/docs/functions/og-image-generation
 * @related src/lib/metadata/generateMetadata.ts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // URLパラメータから画像に表示する情報を取得
    const title = searchParams.get('title') || 'Crypto Media'
    const description = searchParams.get('description') || ''
    const type = searchParams.get('type') || 'default' // article, corporate, media
    const category = searchParams.get('category') || ''

    // 画像サイズ (OGP標準: 1200x630)
    const width = 1200
    const height = 630

    // タイプ別の背景色設定
    const getBackgroundColor = (type: string) => {
      switch (type) {
        case 'article':
          return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        case 'corporate':
          return 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
        case 'media':
          return 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
        default:
          return 'linear-gradient(135deg, #374151 0%, #6b7280 100%)'
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: getBackgroundColor(type),
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* ロゴ/サイト名 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              Crypto Media
            </div>
          </div>

          {/* カテゴリ（ある場合） */}
          {category && (
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '20px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {category}
            </div>
          )}

          {/* タイトル */}
          <div
            style={{
              fontSize: title.length > 50 ? '48px' : '56px',
              fontWeight: 'bold',
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.3,
              marginBottom: '30px',
              maxWidth: '90%',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>

          {/* 説明文（ある場合） */}
          {description && (
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                lineHeight: 1.5,
                maxWidth: '80%',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </div>
          )}

          {/* フッター */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              crypto-media.jp
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    )
  } catch (e) {
    console.error(
      `Failed to generate OG image: ${e instanceof Error ? e.message : 'Unknown error'}`
    )
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
