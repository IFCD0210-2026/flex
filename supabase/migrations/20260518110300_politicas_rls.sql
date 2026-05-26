-- =============================================================
-- Función helper de rol
-- =============================================================

create or replace function public.mi_rol()
returns text
language sql
stable
security definer
as $$
  select rol from public.perfiles where id = auth.uid()
$$;


-- =============================================================
-- perfiles
-- =============================================================

create policy "perfil propio: lectura"
  on public.perfiles for select
  using ( id = auth.uid() );

create policy "perfil propio de cliente: edición"
  on public.perfiles for update
  using ( id = auth.uid() AND rol = 'cliente' )
  with check ( id = auth.uid() AND rol = 'cliente' );

create policy "perfil propio de staff: edición"
  on public.perfiles for update
  using ( id = auth.uid() AND rol = 'staff' )
  with check ( id = auth.uid() AND rol = 'staff' );

create policy "perfil propio de portero: edición"
  on public.perfiles for update
  using ( id = auth.uid() AND rol = 'portero' )
  with check ( id = auth.uid() AND rol = 'portero' );

create policy "admin: puede hacer de todo total perfiles"
  on public.perfiles for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );


-- =============================================================
-- mesas y salas_vip
-- =============================================================

create policy "autenticado: ver mesas"
  on public.mesas for select
  using ( auth.role() = 'authenticated' );

create policy "autenticado: ver salas vip"
  on public.salas_vip for select
  using ( auth.role() = 'authenticated' );

create policy "admin: gestionar mesas"
  on public.mesas for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );

create policy "admin: gestionar salas vip"
  on public.salas_vip for all
  using ( public.mi_rol() = 'admin' )
  with check ( public.mi_rol() = 'admin' );


-- =============================================================
-- productos
-- =============================================================

create policy "autenticado: ver productos"
  on public.productos for select
  using ( auth.role() = 'authenticated' );

create policy "staff/admin: gestionar productos"
  on public.productos for all
  using ( public.mi_rol() in ('staff', 'admin') )
  with check ( public.mi_rol() in ('staff', 'admin') );


-- =============================================================
-- pedidos
-- =============================================================

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


-- =============================================================
-- pedido_items
-- =============================================================

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


-- =============================================================
-- reservas
-- =============================================================

create policy "cliente: ver sus reservas"
  on public.reservas for select
  using ( cliente_id = auth.uid() );

create policy "cliente: crear reserva"
  on public.reservas for insert
  with check (
    cliente_id = auth.uid()
    and public.mi_rol() = 'cliente'
  );

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
