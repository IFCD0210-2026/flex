// src/app/layout.jsx  (añadir IniciarSesion)
'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useSesionStore } from '@/store/sesionStore'

export function IniciarSesion() {
  const { setSesion, limpiarSesion } = useSesionStore()

  useEffect(() => {
    

    // Comprueba si ya hay sesión activa
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { limpiarSesion(); return }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', session.user.id)
        .single()

      setSesion(session.user, perfil?.rol ?? 'cliente')
    })

    // Escucha cambios de sesión (login/logout en otra pestaña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (evento, session) => {
        if (!session) { limpiarSesion(); return }

        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single()

        setSesion(session.user, perfil?.rol ?? 'cliente')
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return null  // componente sin UI
}