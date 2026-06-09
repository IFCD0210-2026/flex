'use server'

import { createClient } from '@/lib/supabase/server'

export async function editarPerfiles(data) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('perfiles')
        .update({
            nombre: data.nombre,
            rol: data.rol,
            activo: data.activo ?? true,
        })
        .eq('id', data.id)

    if (error) {
        return { error: 'Error al editar el perfil.' }
    }

    return { success: true }

    async function guardarEdicion() {
        if (!usuarioEditando) return

        const res = await editarPerfiles({
            id: usuarioEditando.id,
            nombre: formUE.nombre,
            email: formUE.email,
            rol: formUE.rol,
            activo: usuarioEditando.activo,
        })

        if (res?.error) {
            console.error(res.error)
            return
        }

        // actualizar UI local
        const nuevos = usuarios.map((u) =>
            u.id === usuarioEditando.id
                ? { ...u, ...formUE }
                : u
        )

        setUsuarios(nuevos)
        onUsuariosChange?.(nuevos)

        setModalEditar(false)
        setUsuarioEditando(null)
    }
}

