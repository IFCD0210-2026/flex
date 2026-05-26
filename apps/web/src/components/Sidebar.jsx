'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, Crown, User, ShieldCheck, QrCode, LayoutDashboard, X, ChevronUp } from 'lucide-react'
import { useSesionStore } from '@/store/sesionStore'
import { navParaRol } from '@/lib/navPorRol'

const ICONOS = {
  '/':         ShoppingCart,
  '/vip':      Crown,
  '/mi-area':  User,
  '/staff':    ShieldCheck,
  '/porteros': QrCode,
  '/admin':    LayoutDashboard,
}

function NavGroup({ title, items, pathname, onClose }) {
  return (
    <div className="mb-2">
      <p className="px-3 mb-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider">{title}</p>
      {items.map(({ icon: Icon, label, href }) => {
        const activo = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activo
                ? 'bg-gold-500/20 text-gold-400'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </div>
  )
}


export default function Sidebar({ onClose }) {
  const pathname = usePathname()
  const { usuario, rol } = useSesionStore()
  const { cliente: navCliente, gestion: navGestion } = navParaRol(rol ?? 'cliente')

  const itemsCliente = navCliente.map(i => ({ ...i, icon: ICONOS[i.href] }))
  const itemsGestion = navGestion.map(i => ({ ...i, icon: ICONOS[i.href] }))

  return (
    <aside className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="px-6 py-6 border-b border-zinc-800 flex items-center justify-between">
          <FlexLogo className="h-10 w-auto" />
          {onClose && (
            <button onClick={onClose} className="lg:hidden text-zinc-500 hover:text-zinc-100 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {itemsCliente.length > 0 && (
            <NavGroup title="Cliente" items={itemsCliente} pathname={pathname} onClose={onClose} />
          )}
          {itemsGestion.length > 0 && (
            <NavGroup title="Gestión" items={itemsGestion} pathname={pathname} onClose={onClose} />
          )}
        </nav>

        {/* Avatar — navega a perfil */}
        <Link
          href="/perfil"
          onClick={onClose}
          className="px-4 py-4 border-t border-zinc-800 flex items-center gap-3 hover:bg-zinc-800/50 transition-colors w-full text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-gold-500/30 flex items-center justify-center text-gold-400 text-sm font-bold shrink-0">
            {usuario?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">{usuario?.email ?? '—'}</p>
            <p className="text-xs text-zinc-500 capitalize">{rol ?? 'cliente'}</p>
          </div>
          <ChevronUp size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </Link>
    </aside>
  )
}

function FlexLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 160 60" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="FLEX Live Sessions">
      <defs>
        <linearGradient id="sg1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f0c040" />
          <stop offset="100%" stopColor="#a87010" />
        </linearGradient>
      </defs>
      <text x="2" y="42" fontFamily="Georgia, serif" fontSize="44" fontWeight="bold" fontStyle="italic" fill="url(#sg1)" letterSpacing="1">FLEX</text>
      <line x1="2" y1="48" x2="158" y2="48" stroke="#a87010" strokeWidth="0.7" opacity="0.7" />
      <text x="2" y="58" fontFamily="Georgia, serif" fontSize="9" letterSpacing="4" fill="#c8960c" opacity="0.9">LIVE SESSIONS</text>
    </svg>
  )
}
