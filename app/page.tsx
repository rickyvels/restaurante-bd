'use client'
import { useEffect, useState } from 'react'
import { FUNCTIONS_URL, ANON_KEY } from '@/lib/supabase'
import { Download, Play, Code2, ChevronDown, TrendingUp, Package, Coins, Clock, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'reporte_historial'

export default function Reporte() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)
  const [showSQL, setShowSQL] = useState(false)
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [historial, setHistorial] = useState<any[]>([])

  // Cargar resultados guardados al abrir la pagina
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.data?.length) {
          setData(parsed.data)
          setLastRun(parsed.fecha)
          setHistorial(parsed.historial || [])
          setRan(true)
        }
      }
    } catch {}
  }, [])

  async function runReporte() {
    setLoading(true)
    try {
      const res = await fetch(`${FUNCTIONS_URL}/reporte-ventas`, {
        headers: { 'Authorization': `Bearer ${ANON_KEY}` }
      })
      const json = await res.json()
      const rows = Array.isArray(json) ? json : []
      const fecha = new Date().toLocaleString('es-PE')
      
      const nuevoHistorial = [
        { fecha, productos: rows.length, ingresos: rows.reduce((s, r) => s + parseFloat(r.ingreso_total || 0), 0) },
        ...historial
      ].slice(0, 5)

      setData(rows)
      setLastRun(fecha)
      setHistorial(nuevoHistorial)
      setRan(true)

      // Guardar para que persista al volver
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: rows, fecha, historial: nuevoHistorial }))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function downloadCSV() {
    const res = await fetch(`${FUNCTIONS_URL}/reporte-ventas?formato=csv`, {
      headers: { 'Authorization': `Bearer ${ANON_KEY}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'reporte-ventas.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalVendido = data.reduce((s, r) => s + parseFloat(r.total_vendido || 0), 0)
  const totalIngresos = data.reduce((s, r) => s + parseFloat(r.ingreso_total || 0), 0)
  const topProducto = data[0]
  const maxVendido = Math.max(...data.map(r => parseFloat(r.total_vendido || 0)), 1)

  const categoriaColors: Record<string, string> = {
    'Bebidas': 'from-cyan-500 to-blue-500',
    'Entradas': 'from-emerald-500 to-teal-500',
    'Platos principales': 'from-orange-500 to-red-500',
    'Postres': 'from-pink-500 to-rose-500',
    'Desayunos': 'from-amber-500 to-yellow-500',
  }

  return (
    <div className="relative">
      {/* Glow decorativo */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Sparkles size={12} /> Analytics en tiempo real
            </span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Reporte de ventas
          </h1>
          {lastRun && (
            <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Clock size={13} /> Última ejecución: {lastRun}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={runReporte} disabled={loading}
            className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40 hover:scale-[1.02]">
            <Play size={15} className="group-hover:translate-x-0.5 transition-transform" />
            {loading ? 'Analizando...' : 'Ejecutar reporte'}
          </button>
          {ran && data.length > 0 && (
            <button onClick={downloadCSV}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Download size={15} /> CSV
            </button>
          )}
        </div>
      </div>

      {/* Metricas hero */}
      {ran && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Package size={15} className="text-orange-500" /> Productos destacados
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.length}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">con más de 2 unidades vendidas</div>
          </div>
          <div className="relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
              <Coins size={15} className="text-emerald-500" /> Ingresos totales
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">S/ {totalIngresos.toFixed(2)}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{totalVendido} unidades vendidas</div>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/20">
            <div className="flex items-center gap-2 text-orange-100 text-sm mb-1">
              <TrendingUp size={15} /> Top producto
            </div>
            <div className="text-xl font-bold truncate">{topProducto?.producto}</div>
            <div className="text-xs text-orange-100 mt-1">{topProducto?.total_vendido} unidades · S/ {parseFloat(topProducto?.ingreso_total || 0).toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Tabla de resultados con barras */}
      {ran && data.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Ranking de productos</h2>
            <span className="text-xs text-gray-400">GROUP BY · HAVING &gt; 2</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {data.map((r, i) => {
              const pct = (parseFloat(r.total_vendido) / maxVendido) * 100
              const grad = categoriaColors[r.categoria] || 'from-gray-400 to-gray-500'
              return (
                <div key={i} className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-gray-300 dark:text-gray-600 w-5">#{i + 1}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{r.producto}</div>
                        <div className="text-xs text-gray-400">{r.categoria}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">S/ {parseFloat(r.ingreso_total).toFixed(2)}</div>
                      <div className="text-xs text-gray-400">{r.total_vendido} uds</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden ml-8">
                    <div className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Historial de ejecuciones */}
      {historial.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock size={14} className="text-gray-400" /> Historial de consultas
          </h3>
          <div className="space-y-2">
            {historial.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <span className="text-gray-500 dark:text-gray-400">{h.fecha}</span>
                <span className="text-gray-700 dark:text-gray-300">{h.productos} productos · <span className="font-medium text-emerald-600 dark:text-emerald-400">S/ {h.ingresos.toFixed(2)}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SQL oculto en boton colapsable */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button onClick={() => setShowSQL(!showSQL)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Code2 size={16} className="text-orange-500" /> Ver consulta SQL
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform duration-300 ${showSQL ? 'rotate-180' : ''}`} />
        </button>
        {showSQL && (
          <div className="px-5 pb-5">
            <div className="bg-gray-950 rounded-xl p-4 font-mono text-xs leading-relaxed overflow-x-auto border border-gray-800">
              <div className="flex gap-1.5 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <pre className="text-gray-300">{`SELECT c.nombre AS categoria, p.nombre AS producto,
       SUM(dp.cantidad) AS total_vendido,
       SUM(dp.subtotal) AS ingreso_total
FROM DETALLE_PEDIDO dp
  JOIN PRODUCTO p  ON dp.id_producto  = p.id_producto
  JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
GROUP BY c.nombre, p.nombre
HAVING SUM(dp.cantidad) > 2
ORDER BY total_vendido DESC;`}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Estado vacio */}
      {!ran && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 mb-4">
            <TrendingUp size={28} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Tu reporte te espera</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Presiona "Ejecutar reporte" para analizar las ventas en tiempo real</p>
        </div>
      )}
    </div>
  )
}

