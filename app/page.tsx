'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, Users, Package, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ pedidos: 0, clientes: 0, productos: 0, ingresos: 0 })
  const [pedidosRecientes, setPedidosRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, c, pr, d] = await Promise.all([
        supabase.from('pedido').select('*', { count: 'exact', head: true }),
        supabase.from('cliente').select('*', { count: 'exact', head: true }),
        supabase.from('producto').select('*', { count: 'exact', head: true }),
        supabase.from('pedido').select('total'),
      ])
      const ingresos = (d.data || []).reduce((s: number, r: any) => s + parseFloat(r.total || 0), 0)
      setStats({ pedidos: p.count || 0, clientes: c.count || 0, productos: pr.count || 0, ingresos })

      const { data: recientes } = await supabase
        .from('pedido').select('id_pedido, estado, total, fecha_hora, cliente(nombre, apellido)')
        .order('id_pedido', { ascending: false }).limit(5)
      setPedidosRecientes(recientes || [])
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Total pedidos', value: stats.pedidos, icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'Clientes', value: stats.clientes, icon: Users, color: 'text-green-500' },
    { label: 'Productos', value: stats.productos, icon: Package, color: 'text-purple-500' },
    { label: 'Ingresos S/', value: stats.ingresos.toFixed(2), icon: TrendingUp, color: 'text-orange-500' },
  ]

  const estadoBadge: Record<string, string> = {
    'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'En preparacion': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Entregado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Cancelado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      {loading ? (
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{c.label}</span>
                  <c.icon size={18} className={c.color} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Pedidos recientes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">#</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Cliente</th>
                    <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Estado</th>
                    <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosRecientes.map(p => (
                    <tr key={p.id_pedido} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="py-2.5 px-3 text-gray-900 dark:text-white font-medium">#{p.id_pedido}</td>
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                        {p.cliente?.nombre} {p.cliente?.apellido}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge[p.estado] || estadoBadge['Pendiente']}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-900 dark:text-white">S/ {parseFloat(p.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
