import { useMemo, useState } from 'react'
import { CATEGORIES } from '../lib/api'

type Props = {
  value: string
  onChange: (value: string) => void
  suggestions?: string[]
  id?: string
}

/** Preset + custom category — type to add, or pick a suggestion. */
export function CategoryField({ value, onChange, suggestions = [], id = 'category' }: Props) {
  const [mode, setMode] = useState<'pick' | 'custom'>(() => {
    const known = new Set([...CATEGORIES, ...suggestions])
    return value && !known.has(value) ? 'custom' : 'pick'
  })

  const options = useMemo(() => {
    const set = new Set<string>([...CATEGORIES, ...suggestions, value].filter(Boolean))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [suggestions, value])

  const listId = `${id}-suggestions`

  if (mode === 'custom') {
    return (
      <div className="space-y-2">
        <input
          id={id}
          required
          minLength={2}
          maxLength={60}
          list={listId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ef-input"
          placeholder="Type a new category…"
        />
        <datalist id={listId}>
          {options.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button
          type="button"
          className="text-xs text-fern hover:underline"
          onClick={() => {
            setMode('pick')
            if (!options.includes(value)) onChange(CATEGORIES[0])
          }}
        >
          Choose from list instead
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <select
        id={id}
        required
        value={options.includes(value) ? value : CATEGORIES[0]}
        onChange={(e) => {
          if (e.target.value === '__custom__') {
            setMode('custom')
            onChange('')
            return
          }
          onChange(e.target.value)
        }}
        className="ef-input"
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value="__custom__">+ Add new category…</option>
      </select>
      <button
        type="button"
        className="text-xs text-fern hover:underline"
        onClick={() => {
          setMode('custom')
          onChange(value || '')
        }}
      >
        Or type a custom category
      </button>
    </div>
  )
}
