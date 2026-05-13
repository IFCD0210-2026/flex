-- ============================================================
-- FUNCIÓN HELPER: mi_rol()
-- Devuelve el rol del usuario autenticado leyendo perfiles.
-- security definer: se ejecuta con permisos del creador (postgres)
-- para evitar recursión infinita al consultarse dentro de una política.
-- ============================================================

create or replace function public.mi_rol()
returns text
language sql
stable
security definer
as $$
  select rol from public.perfiles where id = auth.uid()
$$;

-- ============================================================
-- POLÍTICAS: perfiles
-- ============================================================

create policy "perfil propio: lectura"
  on public.perfiles for select
  using ( id = auth.uid() );

create policy "perfil propio: edición"
  on public.perfiles for update
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- El admin ve todos los perfiles
create policy "admin: lectura total perfiles"
  on public.perfiles for select
  using ( public.mi_rol() = 'admin' );

-- INSERT lo hace el trigger handle_new_user con service_role (bypasea RLS).

-- ============================================================
-- POLÍTICAS: mesas
-- ============================================================

create policy "autenticado: ver mesas"
  on public.mesas for select
  using ( auth.role() = 'authenticated' );

create policy "admin: gestionar mesas"
  on public.mesas for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );

-- ============================================================
-- POLÍTICAS: salas_vip
-- ============================================================

create policy "autenticado: ver salas vip"
  on public.salas_vip for select
  using ( auth.role() = 'authenticated' );

create policy "admin: gestionar salas vip"
  on public.salas_vip for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );

-- ============================================================
-- POLÍTICAS: productos
-- ============================================================

create policy "autenticado: ver productos"
  on public.productos for select
  using ( auth.role() = 'authenticated' );

create policy "staff/admin: gestionar productos"
  on public.productos for all
  using ( public.mi_rol() in ('staff', 'admin') )
  with check ( public.mi_rol() in ('staff', 'admin') );

-- ============================================================
-- POLÍTICAS: pedidos
-- ============================================================

create policy "cliente: ver sus pedidos"
  on public.pedidos for select
  using (
    cliente_id = auth.uid()
    and public.mi_rol() = 'cliente'
  );

create policy "cliente: crear pedidos"
  on public.pedidos for insert
  with check (
    cliente_id = auth.uid()
    and public.mi_rol() = 'cliente'
  );

create policy "staff: ver todos los pedidos"
  on public.pedidos for select
  using ( public.mi_rol() in ('staff', 'admin') );

create policy "staff: actualizar estado pedido"
  on public.pedidos for update
  using ( public.mi_rol() in ('staff', 'admin') )
  with check ( public.mi_rol() in ('staff', 'admin') );

create policy "admin: borrar pedidos"
  on public.pedidos for delete
  using ( public.mi_rol() = 'admin' );

-- ============================================================
-- POLÍTICAS: pedido_items
-- ============================================================

create policy "cliente: ver items de sus pedidos"
  on public.pedido_items for select
  using (
    exists (
      select 1 from public.pedidos
      where pedidos.id = pedido_items.pedido_id
        and pedidos.cliente_id = auth.uid()
    )
  );

create policy "cliente: insertar items"
  on public.pedido_items for insert
  with check (
    exists (
      select 1 from public.pedidos
      where pedidos.id = pedido_items.pedido_id
        and pedidos.cliente_id = auth.uid()
    )
  );

create policy "staff: ver todos los items"
  on public.pedido_items for select
  using ( public.mi_rol() in ('staff', 'admin') );

-- ============================================================
-- POLÍTICAS: reservas
-- ============================================================

create policy "cliente: ver sus reservas"
  on public.reservas for select
  using ( cliente_id = auth.uid() );

create policy "cliente: crear reserva"
  on public.reservas for insert
  with check (
    cliente_id = auth.uid()
    and public.mi_rol() = 'cliente'
  );

-- El cliente solo puede cambiar su reserva de 'pendiente' a 'cancelada'
create policy "cliente: cancelar reserva pendiente"
  on public.reservas for update
  using (
    cliente_id = auth.uid()
    and estado = 'pendiente'
  )
  with check (
    cliente_id = auth.uid()
    and estado = 'cancelada'
  );

create policy "staff: ver todas las reservas"
  on public.reservas for select
  using ( public.mi_rol() in ('staff', 'admin') );

create policy "admin: gestionar reservas"
  on public.reservas for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );
