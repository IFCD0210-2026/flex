export const NAV_CLIENTE = [
  { label: 'Pedir',     href: '/' },
  { label: 'Salas VIP', href: '/vip' },
  { label: 'Mi área',   href: '/mi-area' },
]

export const NAV_GESTION = [
  { label: 'Staff',    href: '/staff' },
  { label: 'Porteros', href: '/porteros' },
  { label: 'Admin',    href: '/admin' },
]

export function navParaRol(rol) {
  if (rol === 'admin') {
    return { cliente: NAV_CLIENTE, gestion: NAV_GESTION }
  }
  if (rol === 'staff') {
    return { cliente: [], gestion: NAV_GESTION.filter(i => i.href === '/staff') }
  }
  if (rol === 'portero') {
    return { cliente: [], gestion: NAV_GESTION.filter(i => i.href === '/porteros') }
  }
  return { cliente: NAV_CLIENTE, gestion: [] }
}
