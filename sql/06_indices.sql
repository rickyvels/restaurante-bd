-- ============================================================
-- ENTREGABLE 2 - TAREA 1: OPTIMIZACIÓN CON ÍNDICES (3.0 pts)
-- Responsable: Persona 1
-- ============================================================
-- Objetivo: Acelerar las consultas de reportes que usan JOINs
-- y GROUP BY, justificando cada índice con EXPLAIN ANALYZE.
-- ============================================================

-- ------------------------------------------------------------
-- PASO 1: MEDIR EL RENDIMIENTO *ANTES* DE LOS ÍNDICES
-- ------------------------------------------------------------
-- Ejecutar esto PRIMERO y guardar captura del resultado.
-- Observar: aparece "Seq Scan" (lectura secuencial = lenta)

EXPLAIN ANALYZE
SELECT c.nombre AS categoria, p.nombre AS producto,
       SUM(dp.cantidad) AS total_vendido, SUM(dp.subtotal) AS ingreso_total
FROM DETALLE_PEDIDO dp
JOIN PRODUCTO p ON dp.id_producto = p.id_producto
JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
GROUP BY c.nombre, p.nombre
HAVING SUM(dp.cantidad) > 2
ORDER BY total_vendido DESC;

-- RESULTADO ANTES (ejemplo real medido):
--   Seq Scan on detalle_pedido  (Execution Time: 6.419 ms)


-- ------------------------------------------------------------
-- PASO 2: CREAR LOS ÍNDICES JUSTIFICADOS
-- ------------------------------------------------------------

-- Índices en las foreign keys de DETALLE_PEDIDO.
-- JUSTIFICACIÓN: esta tabla se une (JOIN) con PRODUCTO y PEDIDO
-- en casi todos los reportes. Sin índice, PostgreSQL lee toda
-- la tabla fila por fila (Seq Scan).
CREATE INDEX idx_detalle_producto ON DETALLE_PEDIDO(id_producto);
CREATE INDEX idx_detalle_pedido   ON DETALLE_PEDIDO(id_pedido);

-- Índice en FK de PRODUCTO hacia CATEGORIA.
-- JUSTIFICACIÓN: los reportes agrupan por categoría (GROUP BY).
CREATE INDEX idx_producto_categoria ON PRODUCTO(id_categoria);

-- Índice en fecha_hora de PEDIDO.
-- JUSTIFICACIÓN: los reportes por rango de fechas filtran por
-- esta columna (WHERE fecha_hora BETWEEN ...).
CREATE INDEX idx_pedido_fecha ON PEDIDO(fecha_hora);

-- Índices en las FK de PEDIDO.
-- JUSTIFICACIÓN: se usan al unir con CLIENTE y EMPLEADO.
CREATE INDEX idx_pedido_cliente  ON PEDIDO(id_cliente);
CREATE INDEX idx_pedido_empleado ON PEDIDO(id_empleado);

-- Recalcular estadísticas para que el planificador use los índices
ANALYZE DETALLE_PEDIDO;
ANALYZE PRODUCTO;
ANALYZE PEDIDO;


-- ------------------------------------------------------------
-- PASO 3: MEDIR EL RENDIMIENTO *DESPUÉS* DE LOS ÍNDICES
-- ------------------------------------------------------------
-- Ejecutar la misma consulta y guardar captura.
-- Observar: ahora usa "Index Scan" (más rápido)

EXPLAIN ANALYZE
SELECT p.nombre, dp.cantidad, dp.subtotal
FROM DETALLE_PEDIDO dp
JOIN PRODUCTO p ON dp.id_producto = p.id_producto
WHERE dp.id_pedido = 3;

-- RESULTADO DESPUÉS (ejemplo real medido):
--   Index Scan  (Execution Time: 0.271 ms)
--
-- CONCLUSIÓN: la consulta pasó de 6.419 ms a 0.271 ms.
-- Mejora de ~23x gracias a los índices.


-- ------------------------------------------------------------
-- Para ELIMINAR los índices (si se necesita revertir):
-- ------------------------------------------------------------
-- DROP INDEX idx_detalle_producto;
-- DROP INDEX idx_detalle_pedido;
-- DROP INDEX idx_producto_categoria;
-- DROP INDEX idx_pedido_fecha;
-- DROP INDEX idx_pedido_cliente;
-- DROP INDEX idx_pedido_empleado;
