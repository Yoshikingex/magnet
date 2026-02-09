'use client'

interface AgencyTabsProps {
  agencies: { id: number; name: string; store_count?: number }[]
  selectedId: number | null
  onSelect: (id: number | null) => void
}

export default function AgencyTabs({ agencies, selectedId, onSelect }: AgencyTabsProps) {
  // 代理店名の短縮表示
  const shortName = (name: string): string => {
    if (name.includes('Baddet')) return 'Baddet'
    if (name.includes('ネクサス')) return 'ネクサス'
    if (name.includes('ウーバー')) return 'ウーバー'
    if (name.includes('東海')) return '東海'
    if (name.includes('KG')) return 'KG'
    return name
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`
          px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${
            selectedId === null
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }
        `}
      >
        全体
      </button>
      {agencies.map((agency) => (
        <button
          key={agency.id}
          onClick={() => onSelect(agency.id)}
          className={`
            px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${
              selectedId === agency.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }
          `}
        >
          {shortName(agency.name)}
          {agency.store_count !== undefined && (
            <span className="ml-1 text-xs opacity-70">({agency.store_count})</span>
          )}
        </button>
      ))}
    </div>
  )
}
