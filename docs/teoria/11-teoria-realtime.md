# 10 — Teoría: Comunicación en tiempo real y WebSockets

> Lee esto antes de tocar código. Si entiendes esto, el código del siguiente apunte tiene todo el sentido.

---

## El problema: la web es "pregunta-respuesta"

El protocolo que usa la web se llama **HTTP**. Funciona así: el navegador hace una pregunta (petición) y el servidor responde. Fin de la conversación.

```text
Navegador ──── GET /staff ────▶ Servidor
Navegador ◀─── HTML + datos ── Servidor
(silencio)
```

Esto funciona perfectamente para páginas normales. Pero tiene un problema fundamental: **el servidor no puede hablar primero**. Solo responde cuando el navegador pregunta.

Para el panel de staff esto es un problema real: cuando un cliente hace un pedido, el servidor sabe que hay algo nuevo, pero no puede avisarlo. El staff solo se entera si recarga la página.

---

## La solución clásica: el polling

La primera solución que se inventó fue el **polling**: el navegador pregunta cada X segundos si hay algo nuevo.

```text
Navegador ──── ¿hay pedidos nuevos? ────▶ Servidor  (t=0)
Navegador ◀─── no ──────────────────────  Servidor

Navegador ──── ¿hay pedidos nuevos? ────▶ Servidor  (t=3s)
Navegador ◀─── no ──────────────────────  Servidor

Navegador ──── ¿hay pedidos nuevos? ────▶ Servidor  (t=6s)
Navegador ◀─── sí, aquí tienes ─────────  Servidor
```

Funciona, pero tiene dos problemas:
- **Latencia**: si se hace un pedido justo después de preguntar, el staff tarda X segundos en enterarse
- **Desperdicio**: la mayoría de preguntas reciben "no hay nada nuevo"

---

## La solución real: WebSockets

Un **WebSocket** es una conexión persistente entre el navegador y el servidor. A diferencia de HTTP, la conexión no se cierra después de cada intercambio — se queda abierta, y cualquiera de los dos lados puede enviar mensajes en cualquier momento.

```text
Navegador ──── abre conexión ────────────▶ Servidor
         ◀──── conexión aceptada ──────────

(la conexión permanece abierta)

         ◀──── nuevo pedido: Mesa 3 ────── Servidor  (cuando ocurre)
         ◀──── pedido actualizado ──────── Servidor  (cuando ocurre)
```

La gran diferencia: **el servidor puede hablar primero**. Cuando algo cambia en la base de datos, el servidor lo envía al navegador al instante, sin que el navegador tenga que preguntar.

---

### Ejercicio 1 — HTTP vs WebSocket

Dibuja o describe el flujo de comunicación en los dos escenarios siguientes:

**A)** Un staff recarga manualmente la página cada 30 segundos para ver pedidos nuevos.

**B)** Un staff tiene la página abierta con Realtime activo y le llega un nuevo pedido sin recargar.

¿Cuántas peticiones HTTP se hacen en cada caso si hay 10 pedidos nuevos en 5 minutos?

<details>
<summary>Ver respuesta</summary>

**A) Con recarga manual:**
- 10 recargas en 5 minutos = 10 peticiones HTTP
- Cada una carga la página entera (HTML, CSS, JS, datos)
- Si los pedidos llegaron justo después de una recarga, el staff puede tardar hasta 30 segundos en verlos

**B) Con Realtime:**
- 1 petición HTTP inicial para cargar la página
- 1 handshake para abrir el WebSocket
- 10 mensajes enviados por el servidor a través del WebSocket abierto
- El staff lo ve en menos de 1 segundo desde que se hace el pedido

</details>

---

## Cómo encaja la base de datos en esto

Supabase se sienta entre la base de datos (PostgreSQL) y el navegador. Cuando activas Realtime en una tabla, Supabase escucha los cambios de esa tabla con una funcionalidad de PostgreSQL llamada **LISTEN/NOTIFY** y los reenvía por WebSocket a todos los clientes suscritos.

```text
Cliente hace pedido
        │
        ▼
INSERT en tabla "pedidos"
        │
        ▼
PostgreSQL notifica a Supabase Realtime
        │
        ▼
Supabase reenvía el evento por WebSocket
        │
        ├──▶ Staff en móvil A
        ├──▶ Staff en móvil B
        └──▶ Staff en tablet
```

Esto es lo que hace que todos los dispositivos del staff se actualicen al mismo tiempo, sin recargar la página.

---

## Canales y suscripciones

Supabase organiza la comunicación en tiempo real con el concepto de **canal**: un nombre que identifica un flujo de eventos. Puedes pensar en él como una sala de chat — te unes a la sala y recibes todos los mensajes que llegan a ella.

```js
const channel = supabase.channel('pedidos-staff')
```

Dentro de un canal puedes suscribirte a distintos tipos de eventos. Para los cambios en base de datos se usa `postgres_changes`:

```js
channel.on('postgres_changes', {
  event: '*',       // INSERT, UPDATE o DELETE — '*' es "todos"
  schema: 'public',
  table: 'pedidos',
}, (payload) => {
  // payload contiene el tipo de evento y los datos
})
```

El objeto `payload` que llega tiene esta forma:

```js
{
  eventType: 'INSERT',   // o 'UPDATE' o 'DELETE'
  new: { id: 42, estado: 'pendiente', ... },  // fila nueva (INSERT y UPDATE)
  old: { id: 42, estado: 'en_barra',  ... },  // fila anterior (UPDATE y DELETE)
}
```

---

### Ejercicio 2 — El payload de Realtime

Llega este evento de Realtime al panel de staff:

```js
{
  eventType: 'UPDATE',
  new: { id: 7, estado: 'listo', mesa_id: 2 },
  old: { id: 7, estado: 'en_barra', mesa_id: 2 },
}
```

1. ¿Qué ha pasado en la base de datos?
2. ¿Qué debería hacer el panel de staff con este evento?
3. ¿Por qué `new` y `old` no incluyen el nombre de la mesa?

<details>
<summary>Ver respuesta</summary>

1. El pedido con `id: 7` ha pasado del estado `en_barra` a `listo` — alguien (otro staff o la cocina) ha marcado ese pedido como preparado.

2. El panel debería buscar en su estado local el pedido con `id: 7` y reemplazar su estado por `'listo'`. El resto del pedido (mesa, ítems, cliente) no ha cambiado, así que no hace falta refetcharlo.

3. Porque el payload de Realtime solo contiene las columnas directas de la tabla `pedidos`. El nombre de la mesa está en la tabla `mesas` — una relación que Realtime no resuelve automáticamente.

</details>

---

## El ciclo de vida de una suscripción en React

Abrir y cerrar la conexión en el momento correcto es importante. En React esto se hace en un `useEffect`:

```text
1. El componente se monta
        │
        ▼
2. useEffect se ejecuta
   → se abre el canal WebSocket
   → se empieza a recibir eventos
        │
        ▼
3. Llegan eventos → se actualiza el estado
        │
        ▼
4. El componente se desmonta (usuario cambia de página)
        │
        ▼
5. useEffect limpia → se cierra el canal
```

Si no se cierra el canal al desmontar, la conexión queda abierta en memoria y los eventos siguen llegando a un componente que ya no existe. Esto se llama **memory leak**.

---

### Ejercicio 3 — Limpieza del canal

Un compañero escribe este componente:

```jsx
useEffect(() => {
  const channel = supabase
    .channel('pedidos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, handler)
    .subscribe()
}, [])
```

¿Qué falta? ¿Qué problema puede causar en producción?

<details>
<summary>Ver respuesta</summary>

Falta la función de limpieza del `useEffect`:

```js
return () => supabase.removeChannel(channel)
```

Sin ella, cada vez que el componente se monta (o en desarrollo, donde React monta dos veces en modo estricto) se abre un canal nuevo sin cerrar el anterior. Con el tiempo hay múltiples canales abiertos y el handler se ejecuta varias veces por cada evento — el staff vería duplicados en el historial y la app consumiría memoria innecesariamente.

</details>

---

## El problema del INSERT con relaciones

Cuando llega un evento de INSERT, el `payload.new` contiene solo las columnas directas de la tabla `pedidos`:

```js
payload.new = {
  id: 42,
  estado: 'pendiente',
  mesa_id: 3,
  cliente_id: 'uuid...',
  creado_en: '2025-...',
}
```

Lo que **no** contiene son los datos de las tablas relacionadas (`mesas`, `perfiles`, `pedido_items`). Esas relaciones las resuelve Supabase cuando haces un `.select()` explícito, pero el evento de Realtime solo transporta la fila cruda.

La solución es hacer una query adicional con el `id` del pedido nuevo para obtener el objeto completo con todas sus relaciones. Es una petición extra, pero solo ocurre cuando llega un pedido nuevo — no cada pocos segundos como el polling.

---

## Realtime y RLS

Las políticas de seguridad de Supabase (RLS) también se aplican a Realtime. Si una política dice que solo el propio usuario puede leer sus pedidos, un staff que se suscriba a la tabla `pedidos` no recibirá los eventos de otros usuarios.

Para que el staff reciba todos los pedidos necesita una política que lo permita:

```sql
-- Solo los usuarios con rol 'staff' pueden leer todos los pedidos
create policy "staff puede leer pedidos"
on pedidos for select
using (
  exists (
    select 1 from perfiles
    where perfiles.id = auth.uid()
    and perfiles.rol = 'staff'
  )
);
```

Sin esta política, el WebSocket se conecta pero no llegan eventos — y no hay ningún mensaje de error, simplemente silencio.

---

### Ejercicio 4 — RLS y Realtime

El staff instala la app y abre el panel de pedidos. La conexión WebSocket se establece sin errores, pero nunca llegan eventos aunque se estén haciendo pedidos.

¿Cuál es la causa más probable? ¿Cómo lo diagnosticarías?

<details>
<summary>Ver respuesta</summary>

La causa más probable es que RLS está bloqueando los eventos. Supabase aplica las políticas de seguridad también a Realtime — si no hay una política que permita al usuario con rol `staff` leer la tabla `pedidos`, los eventos no se entregan (sin mensaje de error).

Para diagnosticarlo:
1. Comprueba en Supabase Dashboard → Authentication → Policies si existe una política de `SELECT` para `staff` en la tabla `pedidos`.
2. Prueba ejecutando la query directamente en el SQL Editor con el `auth.uid()` del usuario staff.
3. Temporalmente, desactiva RLS en la tabla (`ALTER TABLE pedidos DISABLE ROW LEVEL SECURITY`) — si los eventos empiezan a llegar, confirma que el problema es RLS.

</details>

---

## Resumen en una frase

HTTP es pregunta-respuesta; WebSocket es una conversación abierta. Supabase Realtime usa esa conversación para avisar al navegador cada vez que cambia algo en la base de datos.

---

## Navegación

[← 09 — Teoría: PWA y QR](./09-teoria-pwa-y-qr.md) · [11 — Código: Realtime →](../11-realtime-y-vercel.md)
