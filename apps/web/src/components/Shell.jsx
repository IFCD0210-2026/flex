'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ShoppingCart, Crown, User, UserCircle, LayoutDashboard,
  ShieldCheck, QrCode, X, LayoutGrid,
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { useSesionStore } from '@/store/sesionStore'
import { navParaRol } from '@/lib/navPorRol'

const AUTH_ROUTES = ['/login', '/register']

const ICONOS = {
  '/':         ShoppingCart,
  '/vip':      Crown,
  '/mi-area':  User,
  '/staff':    ShieldCheck,
  '/porteros': QrCode,
  '/admin':    LayoutDashboard,
}

function BottomNav() {
  const pathname = usePathname()
  const [gestionAbierta, setGestionAbierta] = useState(false)
  const rol = useSesionStore((s) => s.rol) ?? 'cliente'
  const { cliente: navCliente, gestion: navGestion } = navParaRol(rol)

  const itemsCliente = navCliente.map(i => ({ ...i, icon: ICONOS[i.href] }))
  const itemsGestion = navGestion.map(i => ({ ...i, icon: ICONOS[i.href] }))
  const hayGestion   = itemsGestion.length > 0
  const gestionActiva = itemsGestion.some(i => i.href === pathname)

  return (
    <>
      {hayGestion && gestionAbierta && (
        <>
          <div className="lg:hidden fixed inset-0 z-30" onClick={() => setGestionAbierta(false)} />
          <div className="lg:hidden fixed bottom-20 inset-x-4 z-40 bg-zinc-900 border border-zinc-700 rounded-2xl p-2 shadow-2xl">
            <p className="text-zinc-600 text-xs font-semibold uppercase tracking-wider px-3 py-2">Gestión</p>
            <div className="grid grid-cols-3 gap-1">
              {itemsGestion.map(({ icon: Icon, label, href }) => {
                const activo = pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setGestionAbierta(false)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors ${
                      activo ? 'bg-gold-500/20 text-gold-400' : 'text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-[11px] font-medium">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 flex items-end">
        {itemsCliente.map(({ icon: Icon, label, href }) => {
          const activo = pathname === href
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 gap-1">
              <Icon size={21} className={activo ? 'text-gold-400' : 'text-zinc-600'} />
              <span className={`text-[10px] font-medium ${activo ? 'text-gold-400' : 'text-zinc-600'}`}>{label}</span>
            </Link>
          )
        })}

        <Link href="/perfil" className="flex-1 flex flex-col items-center py-3 gap-1">
          <UserCircle size={21} className={pathname === '/perfil' ? 'text-gold-400' : 'text-zinc-600'} />
          <span className={`text-[10px] font-medium ${pathname === '/perfil' ? 'text-gold-400' : 'text-zinc-600'}`}>Perfil</span>
        </Link>

        {hayGestion && (
          <button
            onClick={() => setGestionAbierta(v => !v)}
            className="flex-1 flex flex-col items-center -translate-y-3 gap-1"
          >
            <span className={`w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              gestionActiva || gestionAbierta ? 'bg-gold-500' : 'bg-zinc-800 hover:bg-zinc-700'
            }`}>
              {gestionAbierta
                ? <X size={22} className={gestionActiva || gestionAbierta ? 'text-zinc-950' : 'text-zinc-300'} />
                : <LayoutGrid size={22} className={gestionActiva || gestionAbierta ? 'text-zinc-950' : 'text-zinc-300'} />
              }
            </span>
            <span className={`text-[10px] font-medium ${gestionActiva || gestionAbierta ? 'text-gold-400' : 'text-zinc-600'}`}>
              Gestión
            </span>
          </button>
        )}
      </nav>
    </>
  )
}

export default function Shell({ children }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { usuario, cargando } = useSesionStore()

  useEffect(() => {
    if (!cargando && !usuario && !AUTH_ROUTES.includes(pathname)) {
      router.replace('/login')
    }
  }, [cargando, usuario, pathname])

  if (AUTH_ROUTES.includes(pathname)) return <>{children}</>

  if (cargando || !usuario) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="lg:hidden flex items-center justify-center px-4 py-3 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
          <span className="font-display italic font-bold text-gold-400 text-2xl tracking-widest">FLEX</span>
        </header>

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
