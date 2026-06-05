# Restaurante App — Entregable 1

Sistema de gestión de restaurante con Next.js + Supabase.

## Requisitos
- Node.js 18+
- Cuenta en Supabase (ya configurada)

## Instalación

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Páginas
- `/` — Dashboard con estadísticas
- `/pedidos` — CRUD complejo (3 tablas en cascada)
- `/reporte` — Reporte GROUP BY + exportar CSV

## Edge Functions en Supabase
- `crear-pedido` — POST, crea pedido en cascada
- `reporte-ventas` — GET, reporte con GROUP BY/HAVING
