'use client'
import { useState } from 'react'
import { FUNCTIONS_URL, ANON_KEY } from '@/lib/supabase'
import { Download, Play } from 'lucide-react'

export default function Reporte() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)

  async function runReporte() {
    setLoading(true)
    const res = await fetch(`${FUNCTIONS_URL}/reporte-ventas`, {
      headers: { 'Authorization': `Bearer ${ANON_KEY}` }
    })
    const json = await res.json()
    setData(Array.isArray(json) ? json : [])
    setRan(true); setLoading(false)
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

  const totalVendido = data.reduce((s, r) => s + parseFloat(r.total_vendido || 0), 0)
  const totalIngresos = data.reduce((s, r) => s + parseFloat(r.ingreso_total || 0), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reporte de ventas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">GROUP BY categoría + HAVING cantidad &gt; 2</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runReporte} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            <Play size={15} /> {loading ? 'Ejecutando...' : 'Ejecutar reporte'}
          </button>
          {ran && data.length > 0 && (
            <button onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Download size={15} /> Descargar CSV
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 font-mono text-xs text-gray-600 dark:text-gray-400">
        <span className="text-purple-600 dark:text-purple-400">SELECT </span>c.nombre, p.nombre, SUM(dp.cantidad), SUM(dp.subtotal)<br/>
        <span className="text-purple-600 dark:text-purple-400">FROM </span>DETALLE_PEDIDO dp
        <span className="text-purple-600 dark:text-purple-400"> JOIN </span>PRODUCTO p ...
        <span className="text-purple-600 dark:text-purple-400"> JOIN </span>CATEGORIA c ...<br/>
        <span className="text-purple-600 dark:text-purple-400">GROUP BY </span>c.nombre, p.nombre
        <span className="text-purple-600 dark:text-purple-400"> HAVING </span>SUM(dp.cantidad) &gt; 2
        <span className="text-purple-600 dark:text-purple-400"> ORDER BY </span>total_vendido DESC;
      </div>

      {ran && data.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Productos en reporte', value: data.length },
              { label: 'Unidades vendidas', value: totalVendido },
              { label: 'Ingresos totales', value: `S/ ${totalIngresos.toFixed(2)}` },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{c.label}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Categoría', 'Producto', 'Unidades vendidas', 'Ingreso total'].map(h => (
                    <th key={h} className={`py-3 px-4 text-gray-500 dark:text-gray-400 font-medium text-left ${h.startsWith('Ingreso') || h.startsWith('Unidades') ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{r.categoria}</td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{r.producto}</td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-white">{r.total_vendido}</td>
                    <td className="py-3 px-4 text-right font-medium text-orange-600 dark:text-orange-400">S/ {parseFloat(r.ingreso_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {ran && data.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No hay datos suficientes aún.</div>
      )}
    </div>
  )
}
