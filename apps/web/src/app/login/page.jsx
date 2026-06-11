'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { login } from '../lib/actions/auth'

export default function PaginaLogin() {
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setCargando(true)

    const formData = new FormData(e.target)

    const result = await login(formData)

    setCargando(false)

    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-56px)] md:min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-zinc-800 border border-zinc-700 rounded-3xl p-8 shadow-2xl">
          
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-amber-600 flex items-center justify-center text-2xl font-bold">
              F
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center">
            Bienvenido
          </h1>

          <p className="text-zinc-400 text-center mt-2 mb-8">
            Inicia sesión para continuar
          </p>

          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Correo electrónico
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="correo@email.com"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 py-3 pl-11 pr-4 outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Contraseña
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-zinc-900 border border-zinc-700 py-3 pl-11 pr-12 outline-none focus:border-amber-500 transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarPassword(!mostrarPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {mostrarPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/recuperar-password"
                className="text-sm text-amber-500 hover:text-amber-400"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              disabled={cargando}
              className="
                w-full
                rounded-xl
                bg-amber-600
                py-3
                font-semibold
                text-black
                transition
                hover:bg-amber-500
                disabled:opacity-50
              "
            >
              {cargando ? (
                <span className="flex justify-center items-center gap-2">
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-zinc-400">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="font-semibold text-amber-500 hover:text-amber-400"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}