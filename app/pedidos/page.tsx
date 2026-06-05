'use client'
import { useEffect, useState } from 'react'
import { supabase, FUNCTIONS_URL, ANON_KEY } from '@/lib/supabase'
import { Plus, X } from 'lucide-react'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [mesas, setMesas] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({ id_cliente: '', id_empleado: '', id_mesa: '' })
  const [items, setItems] = useState([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])

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

  function addItem() { setItems([...items, { id_producto: '', cantidad: 1, precio_unitario: 0 }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: string, value: any) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    if (field === 'id_producto') {
      const prod = productos.find(p => p.id_producto === parseInt(value))
      if (prod) updated[i].precio_unitario = prod.precio
    }
    setItems(updated)
  }

  async function handleSubmit() {
    if (!form.id_cliente || !form.id_empleado || !form.id_mesa || items.some(i => !i.id_producto)) {
      setMsg('Completa todos los campos'); return
    }
    setSaving(true); setMsg('')
    const res = await fetch(`${FUNCTIONS_URL}/crear-pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({
        id_cliente: parseInt(form.id_cliente), id_empleado: parseInt(form.id_empleado), id_mesa: parseInt(form.id_mesa),
        productos: items.map(i => ({ id_producto: parseInt(i.id_producto), cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      })
    })
    const data = await res.json()
    if (data.ok) {
      setMsg(`Pedido #${data.id_pedido} creado — S/ ${data.total.toFixed(2)}`)
      setShowForm(false)
      setForm({ id_cliente: '', id_empleado: '', id_mesa: '' })
      setItems([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])
      loadData()
    } else { setMsg(`Error: ${data.error}`) }
    setSaving(false)
  }

  const badge: Record<string, string> = {
    'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'En preparacion': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Entregado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'Cancelado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.startsWith('Error') ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
          {msg}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Nuevo pedido (3 tablas en cascada)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Cliente', field: 'id_cliente', opts: clientes.map(c => ({ v: c.id_cliente, l: `${c.nombre} ${c.apellido}` })) },
              { label: 'Empleado', field: 'id_empleado', opts: empleados.map(e => ({ v: e.id_empleado, l: `${e.nombre} ${e.apellido}` })) },
              { label: 'Mesa', field: 'id_mesa', opts: mesas.map(m => ({ v: m.id_mesa, l: `Mesa ${m.numero} (${m.estado})` })) },
            ].map(({ label, field, opts }) => (
              <div key={field}>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <select value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <option value="">Seleccionar...</option>
                  {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Productos del pedido</label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select value={item.id_producto} onChange={e => updateItem(i, 'id_producto', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <option value="">Producto...</option>
                  {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre} — S/{p.precio}</option>)}
                </select>
                <input type="number" min="1" value={item.cantidad} onChange={e => updateItem(i, 'cantidad', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                <span className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right">S/ {(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                {items.length > 1 && <button onClick={() => removeItem(i)} className="p-1.5 text-red-400 hover:text-red-600"><X size={15} /></button>}
              </div>
            ))}
            <button onClick={addItem} className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 mt-1">
              <Plus size={14} /> Agregar producto
            </button>
            <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white text-right">
              Total: S/ {items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0).toFixed(2)}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {saving ? 'Guardando...' : 'Crear pedido'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? <div className="text-gray-500 dark:text-gray-400">Cargando...</div> : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {['#', 'Cliente', 'Fecha', 'Estado', 'Total'].map(h => (
                  <th key={h} className={`py-3 px-4 text-gray-500 dark:text-gray-400 font-medium text-left ${h === 'Total' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pedidos.map(p => (
                <tr key={p.id_pedido} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">#{p.id_pedido}</td>
                  <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{p.cliente?.nombre} {p.cliente?.apellido}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{p.fecha_hora ? new Date(p.fecha_hora).toLocaleDateString('es-PE') : '-'}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge[p.estado] || badge['Pendiente']}`}>{p.estado}</span></td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">S/ {parseFloat(p.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
