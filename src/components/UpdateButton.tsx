'use client'

import { useState } from 'react'

interface UpdateButtonProps {
  onUpdateComplete: () => void
}

export default function UpdateButton({ onUpdateComplete }: UpdateButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleUpdate = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/update', { method: 'POST' })
      const data = await response.json()

      setResult({
        success: data.success,
        message: data.message,
      })

      if (data.success) {
        onUpdateComplete()
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'ネットワークエラーが発生しました',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleUpdate}
        disabled={isLoading}
        className={`
          px-6 py-2.5 rounded-lg font-medium text-white transition-all duration-200
          ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            データ取得中...
          </span>
        ) : (
          'データ更新'
        )}
      </button>

      {result && (
        <span
          className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}
        >
          {result.message}
        </span>
      )}
    </div>
  )
}
