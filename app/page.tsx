'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ShoppingBag, Users, Package, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function useCounter(target: number, active: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active || target === 0) { setVal(target); return }
    let curr = 0
    const step = target / 40
    const id = setInterval(() => {
      curr = Math.min(curr + step, target)
      setVal(curr >= target ? target : Math.floor(curr))
      if (curr >= target) clearInterval(id)
    }, 16)
    return () => clearInterval(id)
  }, [target, active])
  return val
}

const estadoBadge: Record<string, string> = {
  'Pendiente': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'En preparacion': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Entregado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Cancelado': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

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

  const cnt1 = useCounter(stats.pedidos, !loading)
  const cnt2 = useCounter(stats.clientes, !loading)
  const cnt3 = useCounter(stats.productos, !loading)

  const cards = [
    { label: 'Total pedidos', display: String(cnt1), icon: ShoppingBag, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400', border: 'border-l-blue-500', delay: 'anim-delay-0' },
    { label: 'Clientes', display: String(cnt2), icon: Users, iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500', delay: 'anim-delay-1' },
    { label: 'Productos', display: String(cnt3), icon: Package, iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400', border: 'border-l-purple-500', delay: 'anim-delay-2' },
    { label: 'Ingresos totales', display: `S/ ${stats.ingresos.toFixed(2)}`, icon: TrendingUp, iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400', border: 'border-l-orange-500', delay: 'anim-delay-3' },
  ]

  return (
    <div>
      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resumen general del restaurante</p>
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-800 rounded-xl h-28" />
            ))}
          </div>
          <div className="bg-gray-200 dark:bg-gray-800 rounded-xl h-64" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map(c => (
              <div
                key={c.label}
                className={`animate-fade-up ${c.delay} bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 ${c.border} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider leading-tight">{c.label}</span>
                  <div className={`p-2 rounded-lg ${c.iconBg} flex-shrink-0`}>
                    <c.icon size={15} className={c.iconColor} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{c.display}</div>
              </div>
            ))}
          </div>

          <div
            className="animate-fade-up bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
            style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-gray-400" />
                <h2 className="font-semibold text-gray-900 dark:text-white">Pedidos recientes</h2>
              </div>
              <Link href="/pedidos" className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors group">
                Ver todos <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosRecientes.map(p => (
                    <tr key={p.id_pedido} className="border-t border-gray-50 dark:border-gray-800/50 hover:bg-orange-50/40 dark:hover:bg-orange-950/10 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-xs font-medium text-gray-400">#{p.id_pedido}</td>
                      <td className="py-3.5 px-5 font-medium text-gray-900 dark:text-white">{p.cliente?.nombre} {p.cliente?.apellido}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge[p.estado] || estadoBadge['Pendiente']}`}>
                          {p.estado}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-gray-900 dark:text-white tabular-nums">
                        S/ {parseFloat(p.total).toFixed(2)}
                      </td>
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
