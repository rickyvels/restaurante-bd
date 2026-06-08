'use client'
import React, { useState } from 'react'
import { FUNCTIONS_URL, ANON_KEY } from '@/lib/supabase'
import { Download, Play, Copy, Check, BarChart2, Package, DollarSign, Loader2 } from 'lucide-react'

type Row = { categoria: string; producto: string; total_vendido: string; ingreso_total: string }
type SortKey = 'total_vendido' | 'ingreso_total'

export default function Reporte() {
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('ingreso_total')

  async function runReporte() {
    setLoading(true)
    const res = await fetch(`${FUNCTIONS_URL}/reporte-ventas`, {
      headers: { 'Authorization': `Bearer ${ANON_KEY}` }
    })
    const json = await res.json()
    setData(Array.isArray(json) ? json : [])
    setRan(true)
    setLoading(false)
  }

  async function downloadCSV() {
    const res = await fetch(`${FUNCTIONS_URL}/reporte-ventas?formato=csv`, {
      headers: { 'Authorization': `Bearer ${ANON_KEY}` }
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'reporte.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function copySQL() {
    const sql = `SELECT c.nombre AS categoria, p.nombre AS producto,\n  SUM(dp.cantidad) AS total_vendido, SUM(dp.subtotal) AS ingreso_total\nFROM DETALLE_PEDIDO dp\n  JOIN PRODUCTO p ON dp.id_producto = p.id_producto\n  JOIN CATEGORIA c ON p.id_categoria = c.id_categoria\nGROUP BY c.nombre, p.nombre\nHAVING SUM(dp.cantidad) > 2\nORDER BY total_vendido DESC;`
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sorted = [...data].sort((a, b) => parseFloat(b[sortKey]) - parseFloat(a[sortKey]))
  const totalVendido = data.reduce((s, r) => s + parseFloat(r.total_vendido || '0'), 0)
  const totalIngresos = data.reduce((s, r) => s + parseFloat(r.ingreso_total || '0'), 0)
  const maxIngreso = Math.max(...data.map(r => parseFloat(r.ingreso_total || '0')), 1)

  const summaryCards = [
    { label: 'Productos en reporte', value: String(data.length), icon: BarChart2, iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400' },
    { label: 'Unidades vendidas', value: String(totalVendido), icon: Package, iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconColor: 'text-blue-600 dark:text-blue-400' },
    { label: 'Ingresos totales', value: `S/ ${totalIngresos.toFixed(2)}`, icon: DollarSign, iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reporte de ventas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">GROUP BY categoría · HAVING cantidad &gt; 2</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={runReporte} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? 'Ejecutando...' : 'Ejecutar reporte'}
          </button>
          {ran && data.length > 0 && (
            <button type="button" onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Download size={15} /> CSV
            </button>
          )}
        </div>
      </div>

      {/* SQL Block */}
      <div className="animate-fade-up anim-delay-5 relative group bg-gray-950 dark:bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6 overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <button type="button" onClick={copySQL}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 hover:text-white transition-all duration-200">
            {copied ? <><Check size={12} className="text-emerald-400" /> Copiado</> : <><Copy size={12} /> Copiar SQL</>}
          </button>
        </div>
        <pre className="font-mono text-xs leading-relaxed overflow-x-auto text-left">
          <span className="text-violet-400">SELECT </span>
          <span className="text-gray-300">c.nombre </span><span className="text-violet-400">AS </span><span className="text-sky-300">categoria</span>
          <span className="text-gray-300">, p.nombre </span><span className="text-violet-400">AS </span><span className="text-sky-300">producto</span>
          <span className="text-gray-300">,{'\n'}       </span>
          <span className="text-yellow-300">SUM</span><span className="text-gray-300">(dp.cantidad) </span><span className="text-violet-400">AS </span><span className="text-sky-300">total_vendido</span>
          <span className="text-gray-300">, </span>
          <span className="text-yellow-300">SUM</span><span className="text-gray-300">(dp.subtotal) </span><span className="text-violet-400">AS </span><span className="text-sky-300">ingreso_total</span>
          <span className="text-gray-300">{'\n'}</span>
          <span className="text-violet-400">FROM </span><span className="text-emerald-300">DETALLE_PEDIDO</span><span className="text-gray-300"> dp{'\n'}</span>
          <span className="text-violet-400">  JOIN </span><span className="text-emerald-300">PRODUCTO</span><span className="text-gray-300"> p </span>
          <span className="text-violet-400">ON </span><span className="text-gray-300">dp.id_producto = p.id_producto{'\n'}</span>
          <span className="text-violet-400">  JOIN </span><span className="text-emerald-300">CATEGORIA</span><span className="text-gray-300"> c </span>
          <span className="text-violet-400">ON </span><span className="text-gray-300">p.id_categoria = c.id_categoria{'\n'}</span>
          <span className="text-violet-400">GROUP BY </span><span className="text-gray-300">c.nombre, p.nombre{'\n'}</span>
          <span className="text-violet-400">HAVING </span>
          <span className="text-yellow-300">SUM</span><span className="text-gray-300">(dp.cantidad) </span>
          <span className="text-orange-400">&gt; 2</span><span className="text-gray-300">{'\n'}</span>
          <span className="text-violet-400">ORDER BY </span><span className="text-gray-300">total_vendido </span>
          <span className="text-violet-400">DESC</span><span className="text-gray-500">;</span>
        </pre>
      </div>

      {ran && data.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6 animate-fade-up anim-delay-10">
            {summaryCards.map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${c.iconBg} flex-shrink-0`}>
                  <c.icon size={20} className={c.iconColor} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{c.label}</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="animate-fade-up anim-delay-15 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Ingresos por producto (top {Math.min(sorted.length, 8)})</h3>
            <div className="space-y-3">
              {sorted.slice(0, 8).map((r, i) => {
                const pct = parseFloat(r.ingreso_total) / maxIngreso * 100
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-32 text-xs text-gray-500 dark:text-gray-400 truncate text-right flex-shrink-0">{r.producto}</div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                      <div
                        className="bar-fill h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-end pr-2"
                        style={{ '--bar-pct': `${pct.toFixed(1)}%` } as React.CSSProperties}>
                        {pct > 25 && (
                          <span className="text-xs font-medium text-white">S/{parseFloat(r.ingreso_total).toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-20 text-xs font-semibold text-right text-gray-900 dark:text-white tabular-nums flex-shrink-0">
                      S/ {parseFloat(r.ingreso_total).toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Table */}
          <div className="animate-fade-up anim-delay-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                  <th className="text-left py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Producto</th>
                  <th
                    className={`text-right py-3.5 px-5 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-gray-700 dark:hover:text-gray-200 ${sortKey === 'total_vendido' ? 'text-orange-500' : 'text-gray-400'}`}
                    onClick={() => setSortKey('total_vendido')}>
                    Unidades {sortKey === 'total_vendido' ? '↓' : '↕'}
                  </th>
                  <th
                    className={`text-right py-3.5 px-5 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-gray-700 dark:hover:text-gray-200 ${sortKey === 'ingreso_total' ? 'text-orange-500' : 'text-gray-400'}`}
                    onClick={() => setSortKey('ingreso_total')}>
                    Ingreso {sortKey === 'ingreso_total' ? '↓' : '↕'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => (
                  <tr key={i} className="border-t border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium">{r.categoria}</span>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-gray-900 dark:text-white">{r.producto}</td>
                    <td className="py-3.5 px-5 text-right text-gray-700 dark:text-gray-300 tabular-nums">{r.total_vendido}</td>
                    <td className="py-3.5 px-5 text-right font-bold text-orange-600 dark:text-orange-400 tabular-nums">S/ {parseFloat(r.ingreso_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {ran && data.length === 0 && (
        <div className="text-center py-16 animate-fade-up">
          <BarChart2 size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="font-medium text-gray-500 dark:text-gray-400">No hay datos suficientes</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Se necesitan productos con más de 2 unidades vendidas</p>
        </div>
      )}
    </div>
  )
}
