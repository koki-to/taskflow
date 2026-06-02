'use client'

import { Tag } from '@/types'
import { X } from 'lucide-react'

type Props = {
  tag:        Tag
  onRemove?:  (tagId: string) => void  // 省略可能（削除ボタンを出すか）
}

export function TagBadge({ tag, onRemove }: Props) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: tag.color }}
    >
      {tag.name}

      {onRemove && (
        <button
          onClick={() => onRemove(tag.id)}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}