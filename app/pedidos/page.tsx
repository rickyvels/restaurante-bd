'use client'
import { useEffect, useState } from 'react'
import { supabase, FUNCTIONS_URL, ANON_KEY } from '@/lib/supabase'
import { Plus, X, ChevronDown, Clock } from 'lucide-react'

const HISTORIAL_KEY = 'pedidos_historial'

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [empleados, setEmpleados] = useState<any[]>([])
  const [mesas, setMesas] = useState<any[]>([])
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)
  const [detalles, setDetalles] = useState<Record<number, any[]>>({})
  const [historial, setHistorial] = useState<any[]>([])

  // Cliente se escribe libre
  const [nombreCliente, setNombreCliente] = useState('')
  const [form, setForm] = useState({ id_empleado: '', id_mesa: '' })
  const [items, setItems] = useState([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])

  useEffect(() => {
    try {
      const h = localStorage.getItem(HISTORIAL_KEY)
      if (h) setHistorial(JSON.parse(h))
    } catch {}
    loadData()
  }, [])

  async function loadData() {
    const [p, e, m, pr] = await Promise.all([
      supabase.from('pedido').select('id_pedido, estado, total, fecha_hora, cliente(nombre, apellido)').order('id_pedido', { ascending: false }),
      supabase.from('empleado').select('id_empleado, nombre, apellido'),
      supabase.from('mesa').select('id_mesa, numero, estado'),
      supabase.from('producto').select('id_producto, nombre, precio, stock'),
    ])
    setPedidos(p.data || []); setEmpleados(e.data || [])
    setMesas(m.data || []); setProductos(pr.data || []); setLoading(false)
  }

  async function toggleDetalle(id: number) {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id)
    if (!detalles[id]) {
      const { data } = await supabase
        .from('detalle_pedido')
        .select('cantidad, precio_unitario, subtotal, producto(nombre)')
        .eq('id_pedido', id)
      setDetalles(prev => ({ ...prev, [id]: data || [] }))
    }
  }

  function addItem() { setItems([...items, { id_producto: '', cantidad: 1, precio_unitario: 0 }]) }
  function removeItem(i: number) { setItems(items.filter((_, idx) => idx !== i)) }
  function updateItem(i: number, field: string, value: any) {
    const u = [...items]; u[i] = { ...u[i], [field]: value }
    if (field === 'id_producto') {
      const prod = productos.find(p => p.id_producto === parseInt(value))
      if (prod) u[i].precio_unitario = prod.precio
    }
    setItems(u)
  }

  // Crea (o reutiliza) el cliente a partir del nombre escrito
  async function obtenerIdCliente(nombreCompleto: string): Promise<number | null> {
    const partes = nombreCompleto.trim().split(' ')
    const nombre = partes[0]
    const apellido = partes.slice(1).join(' ') || '-'

    // Buscar si ya existe un cliente con ese nombre y apellido
    const { data: existente } = await supabase
      .from('cliente')
      .select('id_cliente')
      .eq('nombre', nombre)
      .eq('apellido', apellido)
      .maybeSingle()

    if (existente) return existente.id_cliente

    // Si no existe, crearlo (DNI y email generados automáticamente y únicos)
    const sufijo = Date.now().toString().slice(-8)
    const { data: nuevo, error } = await supabase
      .from('cliente')
      .insert({
        nombre, apellido,
        dni: sufijo,
        email: `${nombre.toLowerCase()}.${sufijo}@cliente.com`
      })
      .select('id_cliente')
      .single()

    if (error) { setMsg(`Error al crear cliente: ${error.message}`); return null }
    return nuevo.id_cliente
  }

  async function handleSubmit() {
    if (!nombreCliente.trim()) { setMsg('Error: escribe el nombre del cliente'); return }
    if (!form.id_empleado || !form.id_mesa || items.some(i => !i.id_producto)) {
      setMsg('Error: completa empleado, mesa y productos'); return
    }
    setSaving(true); setMsg('')

    const idCliente = await obtenerIdCliente(nombreCliente)
    if (!idCliente) { setSaving(false); return }

    const res = await fetch(`${FUNCTIONS_URL}/crear-pedido`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
      body: JSON.stringify({
        id_cliente: idCliente, id_empleado: parseInt(form.id_empleado), id_mesa: parseInt(form.id_mesa),
        productos: items.map(i => ({ id_producto: parseInt(i.id_producto), cantidad: i.cantidad, precio_unitario: i.precio_unitario }))
      })
    })
    const data = await res.json()
    if (data.ok) {
      const registro = {
        fecha: new Date().toLocaleString('es-PE'),
        pedido: data.id_pedido, cliente: nombreCliente,
        productos: items.length, total: data.total
      }
      const nuevoHistorial = [registro, ...historial].slice(0, 8)
      setHistorial(nuevoHistorial)
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(nuevoHistorial))

      setMsg(`Pedido #${data.id_pedido} creado para ${nombreCliente} — S/ ${data.total.toFixed(2)}`)
      setShowForm(false); setNombreCliente('')
      setForm({ id_empleado: '', id_mesa: '' })
      setItems([{ id_producto: '', cantidad: 1, precio_unitario: 0 }])
      loadData()
    } else { setMsg(`Error: ${data.error}`) }
    setSaving(false)
  }

  const badge: Record<string, string> = {
    'Pendiente': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    'En preparacion': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    'Entregado': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Cancelado': 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  }

  return (
    <div className="relative">
      <div className="absolute -top-10 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pedidos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestión de comandas del restaurante</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.02]">
          <Plus size={16} /> Nuevo pedido
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm ${msg.startsWith('Error') ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>{msg}</div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Nueva comanda</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Nombre de cliente LIBRE */}
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nombre del cliente</label>
              <input value={nombreCliente} onChange={e => setNombreCliente(e.target.value)}
                placeholder="Ej. Carlos Ramirez"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Empleado</label>
              <select value={form.id_empleado} onChange={e => setForm({...form, id_empleado: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                <option value="">Seleccionar...</option>
                {empleados.map(e => <option key={e.id_empleado} value={e.id_empleado}>{e.nombre} {e.apellido}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Mesa</label>
              <select value={form.id_mesa} onChange={e => setForm({...form, id_mesa: e.target.value})}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                <option value="">Seleccionar...</option>
                {mesas.map(m => <option key={m.id_mesa} value={m.id_mesa}>Mesa {m.numero} ({m.estado})</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Productos</label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2 items-center">
                <select value={item.id_producto} onChange={e => updateItem(i, 'id_producto', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                  <option value="">Producto...</option>
                  {productos.map(p => <option key={p.id_producto} value={p.id_producto}>{p.nombre} — S/{p.precio} (stock {p.stock})</option>)}
                </select>
                <input type="number" min="1" value={item.cantidad} onChange={e => updateItem(i, 'cantidad', parseInt(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                <span className="text-sm text-gray-500 w-20 text-right">S/ {(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                {items.length > 1 && <button onClick={() => removeItem(i)} className="p-1.5 text-red-400 hover:text-red-600"><X size={15} /></button>}
              </div>
            ))}
            <button onClick={addItem} className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1 mt-1">
              <Plus size={14} /> Agregar producto
            </button>
            <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-white text-right">
              Total: S/ {items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0).toFixed(2)}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold">
              {saving ? 'Guardando...' : 'Crear pedido'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {historial.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock size={14} className="text-orange-500" /> Historial de comandas registradas
          </h3>
          <div className="space-y-2">
            {historial.map((h, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-white">#{h.pedido}</span>
                  <span className="text-gray-600 dark:text-gray-300">{h.cliente}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">{h.fecha}</span>
                  <span className="text-gray-500">{h.productos} productos</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">S/ {parseFloat(h.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? <div className="py-12 text-center text-gray-400 animate-pulse">Cargando pedidos...</div> : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Todos los pedidos</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {pedidos.map(p => (
              <div key={p.id_pedido}>
                <button onClick={() => toggleDetalle(p.id_pedido)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white shrink-0">#{p.id_pedido}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-300 truncate">{p.cliente?.nombre} {p.cliente?.apellido}</span>
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {p.fecha_hora ? new Date(p.fecha_hora).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge[p.estado] || badge['Pendiente']}`}>{p.estado}</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">S/ {parseFloat(p.total).toFixed(2)}</span>
                    <ChevronDown size={15} className={`text-gray-400 transition-transform ${expandido === p.id_pedido ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {expandido === p.id_pedido && (
                  <div className="px-5 pb-4 bg-gray-50/50 dark:bg-gray-800/20">
                    {!detalles[p.id_pedido] ? (
                      <div className="py-3 text-xs text-gray-400 animate-pulse">Cargando detalle...</div>
                    ) : (
                      <div className="pt-3 space-y-1.5">
                        {detalles[p.id_pedido].map((d: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm py-1.5 px-3 rounded-lg bg-white dark:bg-gray-900">
                            <span className="text-gray-700 dark:text-gray-300">{d.producto?.nombre} <span className="text-gray-400">× {d.cantidad}</span></span>
                            <span className="font-medium text-gray-900 dark:text-white">S/ {parseFloat(d.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
