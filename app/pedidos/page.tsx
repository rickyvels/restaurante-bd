'use client'
import { useEffect, useState } from 'react'
import { supabase, FUNCTIONS_URL, ANON_KEY } from '@/lib/supabase'
import { Plus, X, Check, ChevronDown, ShoppingBag } from 'lucide-react'

const badge: Record<string, string> = {
  'Pendiente': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'En preparacion': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Entregado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Cancelado': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
const ESTADOS = ['Pendiente', 'En preparacion', 'Entregado', 'Cancelado']
const FILTROS = ['Todos', ...ESTADOS]

type Toast = { msg: string; type: 'success' | 'error' }

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [mesas, setMesas] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('Todos')
  const [editingStatus, setEditingStatus] = useState<number | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [form, setForm] = useState({ id_cliente: '', id_empleado: '', id_mesa: '' })
  const [items, setItems] = useState([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])

  function showToast(msg: string, type: Toast['type']) {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function loadData() {
    const [p, c, e, m, pr] = await Promise.all([
      supabase.from('pedido').select('id_pedido, estado, total, fecha_hora, cliente(nombre, apellido)').order('id_pedido', { ascending: false }),
      supabase.from('cliente').select('id_cliente, nombre, apellido'),
      supabase.from('empleado').select('id_empleado, nombre, apellido'),
      supabase.from('mesa').select('id_mesa, numero, estado'),
      supabase.from('producto').select('id_producto, nombre, precio, stock'),
    ])
    setPedidos(p.data || [])
    setClientes(c.data || [])
    setEmpleados(e.data || [])
    setMesas(m.data || [])
    setProductos(pr.data || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const filtrados = filtro === 'Todos' ? pedidos : pedidos.filter(p => p.estado === filtro)

  function addItem() { setItems([...items, { id_producto: '', cantidad: 1, precio_unitario: 0 }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: string, value: string | number) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'id_producto') {
      const prod = productos.find(p => p.id_producto === parseInt(String(value)))
      if (prod) updated[i].precio_unitario = prod.precio
    }
    setItems(updated)
  }

  async function changeStatus(id: number, estado: string) {
    await supabase.from('pedido').update({ estado }).eq('id_pedido', id)
    setEditingStatus(null)
    showToast(`Estado actualizado a "${estado}"`, 'success')
    loadData()
  }

  async function handleSubmit() {
    if (!form.id_cliente || !form.id_empleado || !form.id_mesa || items.some(i => !i.id_producto)) {
      showToast('Completa todos los campos', 'error'); return
    }
    setSaving(true)
    const res = await fetch(`${FUNCTIONS_URL}/crear-pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({
        id_cliente: parseInt(form.id_cliente),
        id_empleado: parseInt(form.id_empleado),
        id_mesa: parseInt(form.id_mesa),
        productos: items.map(i => ({ id_producto: parseInt(i.id_producto), cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      })
    })
    const data = await res.json()
    if (data.ok) {
      showToast(`Pedido #${data.id_pedido} creado — S/ ${data.total.toFixed(2)}`, 'success')
      setShowForm(false)
      setForm({ id_cliente: '', id_empleado: '', id_mesa: '' })
      setItems([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])
      loadData()
    } else {
      showToast(`Error: ${data.error}`, 'error')
    }
    setSaving(false)
  }

  const total = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pedidos.length} pedidos en total</p>
        </div>
        <button type="button" onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-orange-200 dark:hover:shadow-orange-900/40 hover:-translate-y-0.5 active:translate-y-0">
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl w-fit animate-fade-up anim-delay-5">
        {FILTROS.map(f => (
          <button type="button" key={f} onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filtro === f
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {f}
            {f !== 'Todos' && (
              <span className="ml-1.5 text-xs opacity-50 tabular-nums">
                {pedidos.filter(p => p.estado === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="animate-fade-up anim-delay-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
              <ShoppingBag size={32} className="mb-3 opacity-40" />
              <p className="font-medium">No hay pedidos en esta categoría</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['#', 'Cliente', 'Fecha', 'Estado', 'Total'].map(h => (
                    <th key={h} className={`py-3.5 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === 'Total' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(p => (
                  <tr key={p.id_pedido} className="border-t border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-medium text-gray-400">#{p.id_pedido}</td>
                    <td className="py-3.5 px-5 font-medium text-gray-900 dark:text-white">{p.cliente?.nombre} {p.cliente?.apellido}</td>
                    <td className="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400">
                      {p.fecha_hora ? new Date(p.fecha_hora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      {editingStatus === p.id_pedido ? (
                        <select
                          autoFocus
                          defaultValue={p.estado}
                          aria-label="Cambiar estado"
                          onChange={e => changeStatus(p.id_pedido, e.target.value)}
                          onBlur={() => setEditingStatus(null)}
                          className="text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                          {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <button type="button" onClick={() => setEditingStatus(p.id_pedido)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${badge[p.estado] || badge['Pendiente']}`}>
                          {p.estado}
                          <ChevronDown size={11} className="opacity-60" />
                        </button>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                      S/ {parseFloat(p.total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Slide-over form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          <div className="animate-backdrop absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="animate-slide-right absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-gray-950 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Nuevo pedido</h2>
              <button type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {[
                { label: 'Cliente', field: 'id_cliente', opts: clientes.map(c => ({ v: c.id_cliente, l: `${c.nombre} ${c.apellido}` })) },
                { label: 'Empleado', field: 'id_empleado', opts: empleados.map(e => ({ v: e.id_empleado, l: `${e.nombre} ${e.apellido}` })) },
                { label: 'Mesa', field: 'id_mesa', opts: mesas.map(m => ({ v: m.id_mesa, l: `Mesa ${m.numero} — ${m.estado}` })) },
              ].map(({ label, field, opts }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <select aria-label={label} value={(form as Record<string, string>)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-shadow">
                    <option value="">Seleccionar {label.toLowerCase()}...</option>
                    {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Productos</label>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                      <select aria-label="Seleccionar producto" value={item.id_producto} onChange={e => updateItem(i, 'id_producto', e.target.value)}
                        className="flex-1 px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="">Producto...</option>
                        {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre} — S/{p.precio}</option>)}
                      </select>
                      <input type="number" min="1" aria-label="Cantidad" value={item.cantidad}
                        onChange={e => updateItem(i, 'cantidad', parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-20 text-right font-medium tabular-nums">
                        S/ {(item.cantidad * item.precio_unitario).toFixed(2)}
                      </span>
                      {items.length > 1 && (
                        <button type="button" aria-label="Eliminar producto" onClick={() => removeItem(i)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem}
                  className="mt-2 flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                  <Plus size={14} /> Agregar producto
                </button>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-100 dark:border-orange-900/30">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total del pedido</span>
                <span className="text-xl font-bold text-orange-600 dark:text-orange-400 tabular-nums">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button type="button" onClick={handleSubmit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/40">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Check size={16} />}
                {saving ? 'Creando...' : 'Crear pedido'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] animate-slide-bottom flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-white dark:bg-gray-900 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
