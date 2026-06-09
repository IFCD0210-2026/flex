'use server'

import { createClient } from '@/lib/supabase/server'

export async function verificarEntrada(token) {
  const supabase = await createClient()

  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, inicio, fin, estado_pago, salas_vip ( nombre )')
    .eq('qr_token', token)
    .single()

  if (!reserva) return { valido: false, motivo: 'Entrada no encontrada' }
  if (reserva.estado_pago !== 'pagado') return { valido: false, motivo: 'Pago pendiente o cancelado' }

  const ahora = Date.now()
  const inicio = new Date(reserva.inicio).getTime()
  const fin = new Date(reserva.fin).getTime()
  const margen = 15 * 60 * 1000

  if (ahora < inicio - margen) return { valido: false, motivo: 'Aún no es la hora del evento' }
  if (ahora > fin + margen) return { valido: false, motivo: 'El evento ya ha terminado' }

  return {
    valido: true,
    sala: reserva.salas_vip?.nombre ?? 'Sala VIP',
    inicio: reserva.inicio,
  }
}
