'use client'

import { useState, useTransition, useEffect } from 'react'
import PedidoCard from './PedidoCard'
import { avanzarPedido } from '@/lib/actions/pedidos'
import { createClient } from '@/lib/supabase/client'

const FILTROS = ['todos', 'pendiente', 'en_barra', 'listo', 'entregado']

const LABEL_FILTRO = {
  todos: 'Todos',
  pendiente: 'Pendiente',
  en_barra: 'Preparando',
  listo: 'Listo',
  entregado: 'Entregado',
}

const PEDIDO_SELECT = `
  id, estado, estado_pago, creado_en,
  mesas ( numero ),
  perfiles ( nombre ),
  pedido_items ( cantidad, productos ( nombre ) )
`

function ordenarPorCreacion(lista) {
  return [...lista].sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en))
}

export default function StaffClient({ pedidosIniciales }) {
  const [pedidos, setPedidos] = useState(() => ordenarPorCreacion(pedidosIniciales))
  const [filtro, setFiltro] = useState('todos')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createClient()
    let activo = true

    function insertarOActualizar(pedido) {
      setPedidos(prev => ordenarPorCreacion([
        ...prev.filter(p => p.id !== pedido.id),
        pedido,
      ]))
    }

    function quitarPedido(id) {
      setPedidos(prev => prev.filter(p => p.id !== id))
    }

    async function cargarPedidoPagado(id) {
      const { data, error } = await supabase
        .from('pedidos')
        .select(PEDIDO_SELECT)
        .eq('id', id)
        .eq('estado_pago', 'pagado')
        .not('estado', 'eq', 'cancelado')
        .maybeSingle()

      if (!activo) return

      if (data) insertarOActualizar(data)
      if (!data && !error) quitarPedido(id)
    }

    const channel = supabase
      .channel('pedidos-staff')

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, async (payload) => {
        if (payload.new.estado_pago === 'pagado') {
          await cargarPedidoPagado(payload.new.id)
        }
      })

      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, async (payload) => {
        if (payload.new.estado_pago !== 'pagado' || payload.new.estado === 'cancelado') {
          quitarPedido(payload.new.id)
          return
        }

        let yaExiste = false
        setPedidos(prev => {
          yaExiste = prev.some(p => p.id === payload.new.id)
          return prev.map(p => p.id === payload.new.id
            ? { ...p, estado: payload.new.estado, estado_pago: payload.new.estado_pago }
            : p
          )
        })

        if (!yaExiste) {
          await cargarPedidoPagado(payload.new.id)
        }
      })

      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos' }, (payload) => {
        quitarPedido(payload.old.id)
      })

      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedido_items' }, async (payload) => {
        await cargarPedidoPagado(payload.new.pedido_id)
      })

      .subscribe()

    return () => {
      activo = false
      supabase.removeChannel(channel)
    }
  }, [])

  function avanzar(id, estadoActual) {
    const SIGUIENTE = { pendiente: 'en_barra', en_barra: 'listo', listo: 'entregado' }
    const siguiente = SIGUIENTE[estadoActual]
    if (!siguiente) return

    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: siguiente } : p))

    startTransition(async () => {
      try {
        await avanzarPedido(id, estadoActual)
      } catch {
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: estadoActual } : p))
      }
    })
  }

  const pedidosFiltrados = filtro === 'todos' ? pedidos : pedidos.filter(p => p.estado === filtro)
  const pendientes = pedidos.filter(p => p.estado === 'pendiente').length
  const preparando = pedidos.filter(p => p.estado === 'en_barra').length
  const listos = pedidos.filter(p => p.estado === 'listo').length
  const completados = pedidos.filter(p => p.estado === 'entregado').length

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100">Panel de Staff</h1>
          <p className="text-zinc-500 text-sm mt-1">Gestión de pedidos en tiempo real</p>
        </div>
        {pendientes > 0 && (
          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm px-4 py-2 rounded-xl self-start">
            {pendientes} nuevo{pendientes > 1 ? 's' : ''} pedido{pendientes > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Total</p>
          <p className="text-2xl font-bold text-zinc-100 mt-1">{pedidos.length}</p>
        </div>
        <div className="bg-zinc-900 border border-amber-500/20 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Pendientes</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendientes}</p>
        </div>
        <div className="bg-zinc-900 border border-blue-500/20 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Preparando</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{preparando + listos}</p>
        </div>
        <div className="bg-zinc-900 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-zinc-500 text-xs">Completados</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{completados}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === f ? 'bg-gold-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {LABEL_FILTRO[f]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {pedidosFiltrados.map(pedido => (
          <PedidoCard key={pedido.id} pedido={pedido} onAvanzar={avanzar} />
        ))}
        {pedidosFiltrados.length === 0 && (
          <p className="text-zinc-500 text-sm">No hay pedidos.</p>
        )}
      </div>
    </div>
  )
}
