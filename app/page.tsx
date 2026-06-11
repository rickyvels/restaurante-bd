'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, Users, Package, TrendingUp, ArrowUpRight, Utensils, Coins } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ pedidos: 0, clientes: 0, productos: 0, ingresos: 0 })
  const [pedidosRecientes, setPedidosRecientes] = useState<any[]>([])
  const [topProductos, setTopProductos] = useState<any[]>([])
  const [ventasPorDia, setVentasPorDia] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, c, pr, d] = await Promise.all([
        supabase.from('pedido').select('*', { count: 'exact', head: true }),
        supabase.from('cliente').select('*', { count: 'exact', head: true }),
        supabase.from('producto').select('*', { count: 'exact', head: true }),
        supabase.from('pedido').select('total, fecha_hora'),
      ])
      const ingresos = (d.data || []).reduce((s: number, r: any) => s + parseFloat(r.total || 0), 0)
      setStats({ pedidos: p.count || 0, clientes: c.count || 0, productos: pr.count || 0, ingresos })
      const totales = (d.data || []).slice(-12).map((r: any) => parseFloat(r.total || 0))
      setVentasPorDia(totales)

      const { data: recientes } = await supabase
        .from('pedido').select('id_pedido, estado, total, fecha_hora, cliente(nombre, apellido)')
        .order('id_pedido', { ascending: false }).limit(6)
      setPedidosRecientes(recientes || [])

      const { data: detalles } = await supabase
        .from('detalle_pedido').select('cantidad, subtotal, producto(nombre)')
      const agrupado: Record<string, { cantidad: number, ingreso: number }> = {}
      ;(detalles || []).forEach((dt: any) => {
        const n = dt.producto?.nombre || '—'
        if (!agrupado[n]) agrupado[n] = { cantidad: 0, ingreso: 0 }
        agrupado[n].cantidad += parseFloat(dt.cantidad)
        agrupado[n].ingreso += parseFloat(dt.subtotal || 0)
      })
      const top = Object.entries(agrupado)
        .map(([nombre, v]) => ({ nombre, ...v }))
        .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5)
      setTopProductos(top)
      setLoading(false)
    }
    load()
  }, [])

  const maxVenta = Math.max(...ventasPorDia, 1)
  const maxTop = Math.max(...topProductos.map(t => t.cantidad), 1)

  const badge: Record<string, string> = {
    'Pendiente': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    'En preparacion': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'Entregado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Cancelado': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  }

  const cards = [
    { label: 'Total Pedidos', value: stats.pedidos, icon: ShoppingBag, ring: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Ingresos', value: `S/ ${stats.ingresos.toFixed(0)}`, icon: Coins, ring: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Clientes', value: stats.clientes, icon: Users, ring: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Productos', value: stats.productos, icon: Package, ring: 'text-purple-500', bg: 'bg-purple-500/10' },
  ]

  if (loading) return <div className="py-20 text-center text-gray-400 animate-pulse">Cargando dashboard...</div>

  return (
    <div className="relative">
      <div className="absolute -top-10 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Resumen del restaurante en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.icon size={18} className={c.ring} />
              </div>
              <ArrowUpRight size={15} className="text-gray-300 dark:text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Ingresos por pedido</h2>
              <p className="text-xs text-gray-400">Últimos {ventasPorDia.length} pedidos</p>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp size={12} /> S/ {stats.ingresos.toFixed(2)}
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {ventasPorDia.map((v, i) => (
              <div key={i} className="flex-1 group relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  S/ {v.toFixed(0)}
                </div>
                <div className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 transition-all"
                  style={{ height: `${Math.max((v / maxVenta) * 100, 4)}%`, minHeight: 4 }} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Utensils size={16} className="text-orange-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Top productos</h2>
          </div>
          <div className="space-y-3">
            {topProductos.map((t, i) => (
              <div key={t.nombre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300 truncate">{i + 1}. {t.nombre}</span>
                  <span className="text-gray-400 text-xs shrink-0 ml-2">{t.cantidad} uds</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                    style={{ width: `${(t.cantidad / maxTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">Pedidos recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-50 dark:border-gray-800/50">
                <th className="py-2.5 px-5 font-medium">Pedido</th>
                <th className="py-2.5 px-5 font-medium">Cliente</th>
                <th className="py-2.5 px-5 font-medium">Hora</th>
                <th className="py-2.5 px-5 font-medium">Estado</th>
                <th className="py-2.5 px-5 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedidosRecientes.map(p => (
                <tr key={p.id_pedido} className="border-b border-gray-50 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 px-5 font-semibold text-gray-900 dark:text-white">#{p.id_pedido}</td>
                  <td className="py-3 px-5 text-gray-600 dark:text-gray-300">{p.cliente?.nombre} {p.cliente?.apellido}</td>
                  <td className="py-3 px-5 text-gray-400 text-xs">
                    {p.fecha_hora ? new Date(p.fecha_hora).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge[p.estado] || badge['Pendiente']}`}>{p.estado}</span>
                  </td>
                  <td className="py-3 px-5 text-right font-semibold text-gray-900 dark:text-white">S/ {parseFloat(p.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
