'use client'

import { useState } from 'react'
import { Dog, DailyLog, submitLog } from '@/lib/mock-data'

interface DailyLogTabProps {
  dog: Dog
  logs: DailyLog[]
}

export function DailyLogTab({ dog, logs }: DailyLogTabProps) {
  const [category, setCategory] = useState<'Behavior' | 'Feeding' | 'Bathroom' | 'Medication' | 'General'>('Behavior')
  const [notes, setNotes] = useState('')
  const [mood, setMood] = useState<'rough' | 'ok' | 'great'>('ok')
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return
    
    setSubmitting(true)
    
    await submitLog(dog.id, {
      dogId: dog.id,
      date: new Date().toISOString().split('T')[0],
      category,
      notes,
      mood,
    })
    
    setSubmitting(false)
    setShowSuccess(true)
    
    setTimeout(() => {
      setShowSuccess(false)
      setNotes('')
    }, 2000)
  }

  const moodColor = (m: string) => {
    if (m === 'rough') return 'bg-[#D97A68] text-white'
    if (m === 'great') return 'bg-[#E8EFE6] text-[#5A4A42]'
    return 'bg-[#F7E2BD] text-[#5A4A42]'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-4">
        <h4 className="text-base sm:text-lg font-semibold text-[#5A4A42]">Log Today's Update</h4>

        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
          >
            <option value="Behavior">Behavior</option>
            <option value="Feeding">Feeding</option>
            <option value="Bathroom">Bathroom</option>
            <option value="Medication">Medication</option>
            <option value="General">General</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">
            How's {dog.name}'s mood?
          </label>
          <div className="flex gap-2">
            {(['rough', 'ok', 'great'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`flex-1 py-2 px-1 sm:px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                  mood === m ? moodColor(m) + ' ring-2 ring-[#D76B1A]/40 ring-offset-2' : 'bg-[#F7E2BD]/50 text-[#5A4A42]'
                }`}
              >
                {m === 'rough' ? 'Rough' : m === 'ok' ? 'OK' : 'Great'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`How is ${dog.name} doing today?`}
            required
            className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A] resize-none min-h-[100px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5A4A42] mb-2">
            Add photos (optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            className="w-full text-sm text-[#2E2E2E] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#F7E2BD] file:text-[#5A4A42] hover:file:bg-[#F7E2BD]/80"
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting || !notes.trim()}
          className="w-full inline-flex items-center justify-center rounded-xl bg-[#D76B1A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Log'}
        </button>

        {showSuccess && (
          <div className="p-3 bg-[#E8EFE6] text-[#5A4A42] rounded-xl text-sm font-semibold">
            ✓ Log saved successfully!
          </div>
        )}
      </form>

      <div className="space-y-4">
        <h4 className="text-base sm:text-lg font-semibold text-[#5A4A42]">Recent Logs</h4>
        <div className="space-y-3">
          {!logs || logs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
              <p className="text-[#2E2E2E]/60 text-sm">No logs yet. Start tracking!</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#5A4A42] capitalize">{log.category}</p>
                    <p className="text-xs text-[#2E2E2E]/60">{log.date}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    log.mood === 'rough' ? 'bg-[#D97A68] text-white' :
                    log.mood === 'great' ? 'bg-[#E8EFE6] text-[#5A4A42]' :
                    'bg-[#F7E2BD] text-[#5A4A42]'
                  }`}>
                    {log.mood === 'rough' ? 'Rough' : log.mood === 'great' ? 'Great' : 'OK'}
                  </span>
                </div>
                <p className="text-sm text-[#2E2E2E] leading-relaxed">{log.notes}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
