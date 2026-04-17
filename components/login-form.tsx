'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, setCurrentUser } from '@/lib/auth'

export function LoginForm() {
  const [email, setEmail] = useState('sarah@foster.com')
  const [password, setPassword] = useState('password')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const user = loginUser(email, password)
      if (user) {
        setCurrentUser(user)
        router.push(user.role === 'foster' ? '/foster/dashboard' : '/admin/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[#5A4A42] mb-2">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
          required
        />
        <p className="text-xs text-[#2E2E2E]/60 mt-1">Demo: sarah@foster.com or marcus@admin.com</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#5A4A42] mb-2">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="w-full rounded-xl border border-[#F7E2BD] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D76B1A]/40 focus:border-[#D76B1A]"
          required
        />
      </div>

      {error && (
        <div className="p-3 bg-[#D97A68]/10 border border-[#D97A68] text-[#D97A68] rounded-xl text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center rounded-full bg-[#D76B1A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#D76B1A]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  )
}
