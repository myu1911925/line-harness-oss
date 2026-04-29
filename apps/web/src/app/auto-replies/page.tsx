'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { AutoReply } from '@/lib/api'
import Header from '@/components/layout/header'
import { useAccount } from '@/contexts/account-context'

const MATCH_TYPE_LABELS: Record<string, string> = {
  exact: '完全一致',
  contains: '含む',
}

const RESPONSE_TYPE_LABELS: Record<string, string> = {
  text: 'テキスト',
  image: '画像',
  flex: 'Flex',
}

const emptyForm = {
  keyword: '',
  matchType: 'exact' as 'exact' | 'contains',
  responseType: 'text',
  responseContent: '',
  isActive: true,
}

export default function AutoRepliesPage() {
  const { selectedAccountId } = useAccount()
  const [replies, setReplies] = useState<AutoReply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.autoReplies.list({ accountId: selectedAccountId ?? undefined })
      if (res.success) setReplies(res.data)
      else setError(res.error ?? '読み込みに失敗しました')
    } catch {
      setError('読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [selectedAccountId])

  useEffect(() => { load() }, [load])

  const handleEdit = (reply: AutoReply) => {
    setEditingId(reply.id)
    setForm({
      keyword: reply.keyword,
      matchType: reply.matchType,
      responseType: reply.responseType,
      responseContent: reply.responseContent,
      isActive: reply.isActive,
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    if (!form.keyword.trim() || !form.responseContent.trim()) {
      setError('キーワードと応答内容は必須です')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        const res = await api.autoReplies.update(editingId, form)
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await api.autoReplies.create(form)
        if (!res.success) throw new Error(res.error)
      }
      handleCancel()
      await load()
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (reply: AutoReply) => {
    try {
      await api.autoReplies.update(reply.id, { isActive: !reply.isActive })
      await load()
    } catch {
      setError('更新に失敗しました')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この自動応答を削除しますか？')) return
    try {
      await api.autoReplies.delete(id)
      await load()
    } catch {
      setError('削除に失敗しました')
    }
  }

  return (
    <div>
      <Header title="自動応答" />

      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end mb-4">
          <button
            onClick={handleNew}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#06C755' }}
          >
            + 新規追加
          </button>
        </div>

        {/* フォーム */}
        {showForm && (
          <div className="mb-6 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {editingId ? '自動応答を編集' : '新規自動応答'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">キーワード</label>
                <input
                  type="text"
                  value={form.keyword}
                  onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                  placeholder="例: クーポン"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">マッチ方法</label>
                <select
                  value={form.matchType}
                  onChange={e => setForm(f => ({ ...f, matchType: e.target.value as 'exact' | 'contains' }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="exact">完全一致</option>
                  <option value="contains">含む</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">応答タイプ</label>
                <select
                  value={form.responseType}
                  onChange={e => setForm(f => ({ ...f, responseType: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="text">テキスト</option>
                  <option value="image">画像</option>
                  <option value="flex">Flex</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-green-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">有効</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">応答内容</label>
                <textarea
                  value={form.responseContent}
                  onChange={e => setForm(f => ({ ...f, responseContent: e.target.value }))}
                  rows={4}
                  placeholder={form.responseType === 'text' ? '返信するテキストを入力' : 'JSON を入力'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#06C755' }}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}

        {/* 一覧 */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            自動応答がまだありません
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">キーワード</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">マッチ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">応答タイプ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">有効</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {replies.map(reply => (
                  <tr key={reply.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{reply.keyword}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {MATCH_TYPE_LABELS[reply.matchType] ?? reply.matchType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {RESPONSE_TYPE_LABELS[reply.responseType] ?? reply.responseType}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(reply)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${reply.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {reply.isActive ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(reply)}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(reply.id)}
                          className="px-3 py-1 text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md"
                        >
                          削除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
