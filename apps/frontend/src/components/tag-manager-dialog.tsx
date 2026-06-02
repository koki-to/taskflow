'use client'

import { useState } from 'react'
import { Tag } from '@/types'
import { useTags, useCreateTag, useDeleteTag, useAddTagToTask, useRemoveTagFromTask } from '@/lib/use-tags'
import { TagBadge } from './tag-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tag as TagIcon, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

// カラーの選択肢
const COLOR_OPTIONS = [
  { label: 'グレー',   value: '#6B7280' },
  { label: 'レッド',   value: '#EF4444' },
  { label: 'オレンジ', value: '#F97316' },
  { label: 'イエロー', value: '#EAB308' },
  { label: 'グリーン', value: '#22C55E' },
  { label: 'ブルー',   value: '#3B82F6' },
  { label: 'パープル', value: '#A855F7' },
  { label: 'ピンク',   value: '#EC4899' },
]

type Props = {
  taskId:   string
  taskTags: Tag[]   // 現在タスクに付いているタグ
}

export function TagManagerDialog({ taskId, taskTags }: Props) {
  const [open, setOpen]         = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [selectedColor, setSelectedColor] = useState('#6B7280')

  const { data: allTags = [] } = useTags()
  const createTag              = useCreateTag()
  const deleteTag              = useDeleteTag()
  const addTagToTask           = useAddTagToTask()
  const removeTagFromTask      = useRemoveTagFromTask()

  // タスクに付いているタグのIDセット
  const taskTagIds = new Set(taskTags.map(t => t.id))

  // タグを作成する
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      await createTag.mutateAsync({
        name:  newTagName.trim(),
        color: selectedColor,
      })
      toast.success(`タグ「${newTagName}」を作成しました`)
      setNewTagName('')
    } catch {
      toast.error('タグの作成に失敗しました')
    }
  }

  // タスクにタグを追加・削除する（トグル）
  const handleToggleTag = async (tag: Tag) => {
    try {
      if (taskTagIds.has(tag.id)) {
        // 既に付いている → 削除
        await removeTagFromTask.mutateAsync({ taskId, tagId: tag.id })
        toast.success(`タグ「${tag.name}」を外しました`)
      } else {
        // 付いていない → 追加
        await addTagToTask.mutateAsync({ taskId, tagId: tag.id })
        toast.success(`タグ「${tag.name}」を追加しました`)
      }
    } catch {
      toast.error('タグの操作に失敗しました')
    }
  }

  // タグを削除する
  const handleDeleteTag = async (tag: Tag) => {
    try {
      await deleteTag.mutateAsync(tag.id)
      toast.success(`タグ「${tag.name}」を削除しました`)
    } catch {
      toast.error('タグの削除に失敗しました')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <TagIcon className="w-3 h-3" />
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-white border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle>タグ管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">

          {/* タグ作成フォーム */}
          <div className="space-y-2">
            <Label>新しいタグを作成</Label>

            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="タグ名（20文字以内）"
              maxLength={20}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            />

            {/* カラー選択 */}
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color.value,
                    outline: selectedColor === color.value
                      ? '2px solid #000'
                      : 'none',
                    outlineOffset: '2px',
                  }}
                  title={color.label}
                />
              ))}
            </div>

            <Button
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || createTag.isPending}
              size="sm"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              作成
            </Button>
          </div>

          {/* タグ一覧 */}
          <div className="space-y-2">
            <Label>タグ一覧（クリックで追加・削除）</Label>

            {allTags.length === 0 ? (
              <p className="text-sm text-gray-400">
                タグがありません。上から作成してください。
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {allTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToggleTag(tag)}
                  >
                    <div className="flex items-center gap-2">
                      {/* チェックマーク */}
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          taskTagIds.has(tag.id)
                            ? 'border-transparent'
                            : 'border-gray-300'
                        }`}
                        style={
                          taskTagIds.has(tag.id)
                            ? { backgroundColor: tag.color }
                            : {}
                        }
                      >
                        {taskTagIds.has(tag.id) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>

                      <TagBadge tag={tag} />
                    </div>

                    {/* タグ削除ボタン */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()  // 親のonClickを止める
                        handleDeleteTag(tag)
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}