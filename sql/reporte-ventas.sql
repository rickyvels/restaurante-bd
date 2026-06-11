-- ============================================================
-- ENTREGABLE 1: REPORTES Y EXPORTACION (2 pts)
-- Agregaciones complejas con GROUP BY y HAVING
-- Exportables a CSV desde Supabase (boton Download CSV)
-- ============================================================

-- ===== REPORTE 1: Productos mas vendidos por categoria =====
-- (solo productos con mas de 2 unidades vendidas)
SELECT
    c.nombre         AS categoria,
    p.nombre         AS producto,
    SUM(dp.cantidad) AS total_vendido,
    SUM(dp.subtotal) AS ingreso_total
FROM DETALLE_PEDIDO dp
JOIN PRODUCTO  p ON dp.id_producto = p.id_producto
JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
GROUP BY c.nombre, p.nombre
HAVING SUM(dp.cantidad) > 2
ORDER BY total_vendido DESC;


-- ===== REPORTE 2: Ingresos por sucursal =====
-- (solo sucursales con mas de S/50 en ventas)
SELECT
    s.nombre            AS sucursal,
    s.ciudad            AS ciudad,
    COUNT(pe.id_pedido) AS total_pedidos,
    SUM(pe.total)       AS ingresos_totales
FROM PEDIDO pe
JOIN MESA     m ON pe.id_mesa   = m.id_mesa
JOIN SUCURSAL s ON m.id_scrsal  = s.id_scrsal
GROUP BY s.nombre, s.ciudad
HAVING SUM(pe.total) > 50
ORDER BY ingresos_totales DESC;


-- ===== REPORTE 3: Empleados con mas pedidos atendidos =====
-- (solo empleados con mas de 1 pedido)
SELECT
    e.nombre           AS empleado,
    e.rol              AS rol,
    COUNT(p.id_pedido) AS pedidos_atendidos,
    SUM(p.total)       AS total_vendido
FROM PEDIDO p
JOIN EMPLEADO e ON p.id_empleado = e.id_empleado
GROUP BY e.nombre, e.rol
HAVING COUNT(p.id_pedido) > 1
ORDER BY pedidos_atendidos DESC;


-- ===== REPORTE 4: Clientes con mayor consumo =====
-- (solo clientes que gastaron mas de S/40 en total)
SELECT
    cl.nombre            AS cliente,
    cl.apellido          AS apellido,
    COUNT(pe.id_pedido)  AS cantidad_pedidos,
    SUM(pe.total)        AS gasto_total
FROM PEDIDO pe
JOIN CLIENTE cl ON pe.id_cliente = cl.id_cliente
GROUP BY cl.nombre, cl.apellido
HAVING SUM(pe.total) > 40
ORDER BY gasto_total DESC;
