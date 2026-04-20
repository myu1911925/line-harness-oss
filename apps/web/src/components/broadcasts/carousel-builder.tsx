'use client'

import { useState, useEffect } from 'react'

interface BubbleData {
  imageUrl: string
  title: string
  description: string
  buttonLabel: string
  productUrl: string
  utmCampaign: string
}

interface CarouselBuilderProps {
  onChange: (json: string) => void
}

const defaultCampaign = () => {
  const d = new Date()
  return `line${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

const emptyBubble = (): BubbleData => ({
  imageUrl: '',
  title: '',
  description: '',
  buttonLabel: '詳しく見る',
  productUrl: '',
  utmCampaign: defaultCampaign(),
})

function buildFlexJson(bubbles: BubbleData[]): string {
  const contents = bubbles.map((b) => {
    const url = b.productUrl
      ? `${b.productUrl}${b.productUrl.includes('?') ? '&' : '?'}utm_source=line&utm_medium=broadcast${b.utmCampaign ? `&utm_campaign=${b.utmCampaign}` : ''}`
      : ''

    const bubble: Record<string, unknown> = {
      type: 'bubble',
      size: 'kilo',
    }

    if (b.imageUrl) {
      bubble.hero = {
        type: 'image',
        url: b.imageUrl,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      }
    }

    bubble.body = {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        ...(b.title ? [{
          type: 'text',
          text: b.title,
          weight: 'bold',
          size: 'md',
          wrap: true,
          color: '#333333',
        }] : []),
        ...(b.description ? [{
          type: 'text',
          text: b.description,
          size: 'sm',
          color: '#666666',
          wrap: true,
        }] : []),
      ],
    }

    if (url) {
      bubble.footer = {
        type: 'box',
        layout: 'vertical',
        contents: [{
          type: 'button',
          action: {
            type: 'uri',
            label: b.buttonLabel || '詳しく見る',
            uri: url,
          },
          style: 'primary',
          color: '#C97878',
        }],
      }
    }

    return bubble
  })

  if (contents.length === 1) return JSON.stringify(contents[0], null, 2)
  return JSON.stringify({ type: 'carousel', contents }, null, 2)
}

export default function CarouselBuilder({ onChange }: CarouselBuilderProps) {
  const [bubbles, setBubbles] = useState<BubbleData[]>([emptyBubble()])

  useEffect(() => {
    onChange(buildFlexJson(bubbles))
  }, [bubbles]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = (index: number, field: keyof BubbleData, value: string) => {
    setBubbles((prev) => prev.map((b, i) => i === index ? { ...b, [field]: value } : b))
  }

  const addBubble = () => {
    if (bubbles.length >= 10) return
    setBubbles((prev) => [...prev, emptyBubble()])
  }

  const removeBubble = (index: number) => {
    if (bubbles.length <= 1) return
    setBubbles((prev) => prev.filter((_, i) => i !== index))
  }

  const copyBubble = (index: number) => {
    if (bubbles.length >= 10) return
    setBubbles((prev) => [
      ...prev.slice(0, index + 1),
      { ...prev[index] },
      ...prev.slice(index + 1),
    ])
  }

  return (
    <div className="space-y-4">
      {bubbles.map((bubble, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-600">コマ {index + 1}</span>
            <div className="flex gap-2">
              {bubbles.length < 10 && (
                <button
                  type="button"
                  onClick={() => copyBubble(index)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  コピー
                </button>
              )}
              {bubbles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBubble(index)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  削除
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">画像URL（任意）</label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="https://cdn.shopify.com/..."
                value={bubble.imageUrl}
                onChange={(e) => update(index, 'imageUrl', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">商品名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="例: 夏用絽の半衿"
                value={bubble.title}
                onChange={(e) => update(index, 'title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">説明文（任意）</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white resize-none"
                rows={2}
                placeholder="例: 涼しげな透け感が人気の夏定番。"
                value={bubble.description}
                onChange={(e) => update(index, 'description', e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">商品URL <span className="text-red-500">*</span></label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  placeholder="https://kimonosenkosha.com/products/..."
                  value={bubble.productUrl}
                  onChange={(e) => update(index, 'productUrl', e.target.value)}
                />
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-500 mb-1">UTMキャンペーン</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  placeholder="240423"
                  value={bubble.utmCampaign}
                  onChange={(e) => update(index, 'utmCampaign', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">ボタンのラベル</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                placeholder="詳しく見る"
                value={bubble.buttonLabel}
                onChange={(e) => update(index, 'buttonLabel', e.target.value)}
              />
            </div>

            {bubble.productUrl && (
              <p className="text-xs text-gray-400 break-all">
                リンク先: {bubble.productUrl}{bubble.productUrl.includes('?') ? '&' : '?'}utm_source=line&utm_medium=broadcast{bubble.utmCampaign ? `&utm_campaign=${bubble.utmCampaign}` : ''}
              </p>
            )}
          </div>
        </div>
      ))}

      {bubbles.length < 10 && (
        <button
          type="button"
          onClick={addBubble}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
        >
          ＋ コマを追加
        </button>
      )}
    </div>
  )
}
