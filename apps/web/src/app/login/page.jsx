'use client'

import { useState } from 'react'
import Link from 'next/link'
import FlexLogo from '@/components/layout/FlexLogo'
import { login } from '@/lib/actions/auth'
import Image from 'next/image'
import { Mail } from "lucide-react"

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
    <div className="min-h-screen flex">
      {/* Panel izquierdo — foto */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <Image
          width={400}
          height={400}
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80"
          alt="Ambiente Flex"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-zinc-950/60 to-zinc-950/10" />
        <div className="absolute bottom-12 left-10 right-10">
          <p className="text-white/80 text-xl font-light italic leading-relaxed">
            La noche que siempre<br />quisiste vivir.
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-zinc-950">
        <div className="lg:hidden absolute inset-0 -z-10">
          <Image
            width={400}
            height={400}
            loading="eager"
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10 flex justify-center">
            <FlexLogo className="h-12 w-auto" />
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