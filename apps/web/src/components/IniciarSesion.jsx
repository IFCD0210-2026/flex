'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSesionStore } from '@/store/sesionStore'

export default function IniciarSesion() {
  const { setSesion, limpiarSesion } = useSesionStore()

  useEffect(() => {
    const supabase = createClient()

    async function cargarSesion(session) {
      if (!session) { limpiarSesion(); return }
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', session.user.id)
        .single()
      setSesion(session.user, perfil?.rol ?? 'cliente')
    }

    supabase.auth.getSession().then(({ data: { session } }) => cargarSesion(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evento, session) => {
      cargarSesion(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
