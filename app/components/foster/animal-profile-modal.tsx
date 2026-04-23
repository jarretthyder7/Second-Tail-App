'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Trait {
  housetrained?: boolean
  kidsOk?: boolean
  dogsOk?: boolean
  catsOk?: boolean
  vaccinated?: boolean
  specialNeeds?: boolean
  activityLevel?: string
}

interface Animal {
  id: string
  name: string
  breed?: string
  ageGroup?: string
  ageYears?: number | null
  sex?: string
  size?: string
  species?: string
  needsFoster?: boolean
  photo?: string | null
  description?: string
  traits?: Trait
  listingUrl?: string
  rescue?: {
    id?: string
    name?: string
    city?: string
    state?: string
    email?: string
    phone?: string | null
    url?: string | null
    inNetwork?: boolean
  }
}

interface Foster {
  name?: string
  email?: string
  city?: string
  state?: string
}

interface AnimalProfileModalProps {
  isOpen: boolean
  onClose: () => void
  animal: Animal | null
  foster: Foster
}

function buildMailto(a: Animal, foster: Foster): string | null {
  const rescueEmail = a.rescue?.email
  if (!rescueEmail) return null
  const rescueName = a.rescue?.name || 'there'
  const fosterName = foster.name || 'a hopeful foster'
  const where = [foster.city, foster.state].filter(Boolean).join(', ')
  const subject = `${fosterName} is interested in fostering ${a.name}`
  const body = [
    `Hi ${rescueName},`,
    '',
    `I'm ${fosterName}${where ? ` in ${where}` : ''}. I saw ${a.name} on Second Tail (getsecondtail.com) and would love to foster them.`,
    '',
    `Second Tail is a free platform that helps rescues and fosters coordinate — communication, care plans, supply requests, all in one place. I'm signed up and ready. If you'd like to try it together, I can introduce you to the team.`,
    '',
    `Either way, I'd love to learn more about ${a.name} and your fostering process.`,
    '',
    `Thanks for the work you do!`,
    `— ${fosterName}`,
  ].join('\n')
  return `mailto:${encodeURIComponent(rescueEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function AnimalProfileModal({
  isOpen,
  onClose,
  animal: a,
  foster,
}: AnimalProfileModalProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!isOpen || !a) return null

  const displayName = a.ageYears != null ? `${a.name}, ${a.ageYears}` : a.name
  const metaLine = [a.breed, a.sex, a.size].filter(Boolean).join(' · ')
  const tr = a.traits || {}
  const goodWith: Array<{ icon: string; label: string }> = []
  if (tr.kidsOk) goodWith.push({ icon: '👶', label: 'Kids' })
  if (tr.dogsOk) goodWith.push({ icon: '🐕', label: 'Dogs' })
  if (tr.catsOk) goodWith.push({ icon: '🐈', label: 'Cats' })
  const aboutChips: Array<{ icon: string; label: string }> = []
  if (tr.housetrained) aboutChips.push({ icon: '🏠', label: 'House-trained' })
  if (tr.vaccinated) aboutChips.push({ icon: '💉', label: 'Vaccinated' })
  if (tr.activityLevel) aboutChips.push({ icon: '⚡', label: tr.activityLevel })

  const mailto = buildMailto(a, foster)
  const rescueLocation = [a.rescue?.city, a.rescue?.state].filter(Boolean).join(', ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/55 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92dvh] overflow-y-auto flex flex-col"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Photo */}
        <div
          className="relative w-full flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #FDF6EC 0%, #F7E2BD 100%)',
            minHeight: 180,
            maxHeight: '42vh',
          }}
        >
          {a.photo ? (
            <img
              src={a.photo}
              alt={a.name}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '42vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement
                t.style.display = 'none'
              }}
            />
          ) : (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D76B1A" strokeWidth="1.5">
              <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2 .352-3.5 2.435-3.5 5.348 0 4.817 3.1 8.652 5.5 8.652C11 17 12 14 12 14s1 3 3.5 3c2.4 0 5.5-3.835 5.5-8.652C21 5.435 19.5 3.352 17.5 3 15.577 2.679 14 3.782 14 5.172" />
            </svg>
          )}
          {/* Close pill */}
          <button
            onClick={onClose}
            aria-label="Close"
            type="button"
            className="absolute top-3.5 right-3.5 w-10 h-10 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-gray-900 hover:scale-105 active:scale-95 transition-transform"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
          {/* RescueGroups credit */}
          <div
            className="absolute bottom-1.5 left-2.5 text-[10px] font-medium text-white/85"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
          >
            via rescuegroups.org
          </div>
        </div>

        {/* Profile body */}
        <div className="p-5 flex flex-col gap-3">
          {/* Name + status */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2
              className="text-2xl font-bold text-[#1F1B18] leading-tight"
              style={{ fontFamily: 'Lora, serif', letterSpacing: '-0.01em' }}
            >
              {displayName}
            </h2>
            <span
              className={`text-[11.5px] font-bold tracking-wide px-2.5 py-1 rounded-full shadow-sm ${
                a.needsFoster
                  ? 'bg-[#D76B1A] text-white'
                  : 'bg-[#5A8F5A] text-white'
              }`}
            >
              {a.needsFoster ? '🐾 Needs foster' : '✓ Adoptable'}
            </span>
          </div>
          {metaLine && (
            <div className="text-[13px] text-[#4A3C36] font-medium">
              {metaLine}
            </div>
          )}

          {/* Rescue line */}
          {a.rescue?.name && (
            <div className="flex items-start gap-2 text-[13px] text-[#4A3C36] leading-snug">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="flex-1">
                <strong className="text-[#1F1B18]">{a.rescue.name}</strong>
                {rescueLocation && <span className="opacity-70"> · {rescueLocation}</span>}
                {a.rescue.inNetwork && (
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10.5px] font-bold tracking-wide">
                    ✨ On Second Tail
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Good with */}
          {goodWith.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A3C36] opacity-70 mb-2">
                🤝 Good with
              </div>
              <div className="flex gap-2 flex-wrap">
                {goodWith.map((b, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl bg-[#FDF6EC] border border-[#F7E2BD] min-w-[60px]"
                  >
                    <span className="text-lg leading-none">{b.icon}</span>
                    <span className="text-[11px] font-semibold text-[#4A3C36]">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {(a.description || aboutChips.length > 0) && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A3C36] opacity-70 mb-2">
                📖 About {a.name}
              </div>
              {aboutChips.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {aboutChips.map((c, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F7E2BD] text-[#1F1B18] text-[11.5px] font-medium"
                    >
                      <span>{c.icon}</span>
                      <span>{c.label}</span>
                    </span>
                  ))}
                </div>
              )}
              {a.description && (
                <p className="text-[13.5px] leading-relaxed text-[#1F1B18]">
                  {showDetails || a.description.length <= 180
                    ? a.description
                    : a.description.slice(0, 177) + '…'}
                  {a.description.length > 180 && (
                    <button
                      type="button"
                      onClick={() => setShowDetails((v) => !v)}
                      className="ml-1 text-[#D76B1A] font-semibold hover:underline"
                    >
                      {showDetails ? ' Less' : ' More'}
                    </button>
                  )}
                </p>
              )}
            </div>
          )}

          {/* CTA — email outreach only */}
          <div className="pt-2">
            {mailto ? (
              <a
                href={mailto}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#D76B1A] text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email {a.rescue?.name || 'this rescue'}
              </a>
            ) : (
              <div className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-center text-[13px] text-gray-600">
                {a.rescue?.name || 'This rescue'} doesn&apos;t have a public email. Try visiting their site.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
