'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      return
    }

    const role = data.user?.app_metadata?.role

    router.push(
      role === 'cfo' ? '/dashboard/cfo' : '/dashboard/ciso'
    )

    router.refresh()
  }

  return (
    <form
      onSubmit={handleLogin}
      className="max-w-sm mx-auto mt-20 space-y-4"
    >
      <h1 className="text-xl font-semibold">QuantifySec Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 w-full"
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 w-full"
        required
      />

      {error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="bg-black text-white p-2 w-full"
      >
        Log in
      </button>
    </form>
  )
}