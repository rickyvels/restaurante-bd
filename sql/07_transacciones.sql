-- ============================================================
-- ENTREGABLE 2 - TAREA 2: GESTIÓN DE TRANSACCIONES ACID (1.0 pt)
-- Responsable: Persona 2
-- ============================================================
-- Objetivo: Implementar una venta crítica que cumpla ACID
-- usando BEGIN, COMMIT y ROLLBACK. Si algo falla, NADA se guarda.
-- ============================================================

-- ------------------------------------------------------------
-- EJEMPLO 1: TRANSACCIÓN EXITOSA (BEGIN ... COMMIT)
-- ------------------------------------------------------------
-- Una venta toca 3 tablas. Si todas funcionan, COMMIT confirma.

BEGIN;

  -- 1. Crear el pedido
  INSERT INTO PEDIDO (id_cliente, id_empleado, id_mesa, estado, total)
  VALUES (1, 1, 1, 'Pendiente', 0);

  -- 2. Agregar el detalle
  INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
  VALUES (currval('pedido_id_pedido_seq'), 5, 2, 35.00, 70.00);

  -- 3. Descontar stock
  UPDATE PRODUCTO SET stock = stock - 2 WHERE id_producto = 5;

  -- 4. Actualizar total
  UPDATE PEDIDO SET total = 70.00
  WHERE id_pedido = currval('pedido_id_pedido_seq');

COMMIT;  -- ← Confirma TODOS los cambios juntos

-- Si llegamos aquí, la venta se guardó completa.


-- ------------------------------------------------------------
-- EJEMPLO 2: TRANSACCIÓN QUE FALLA (ROLLBACK manual)
-- ------------------------------------------------------------
-- Si el stock no alcanza, deshacemos TODO con ROLLBACK.

BEGIN;

  INSERT INTO PEDIDO (id_cliente, id_empleado, id_mesa, estado, total)
  VALUES (2, 3, 2, 'Pendiente', 0);

  -- Intento de vender más de lo que hay → decidimos abortar
  -- (en la práctica esto lo detecta la función de abajo)

ROLLBACK;  -- ← Deshace TODO. El pedido NO se guarda.


-- ------------------------------------------------------------
-- EJEMPLO 3: FUNCIÓN CON CONTROL AUTOMÁTICO DE TRANSACCIÓN
-- ------------------------------------------------------------
-- Una función PL/pgSQL es atómica: si lanza EXCEPTION,
-- PostgreSQL hace ROLLBACK automático de todo lo que hizo.

CREATE OR REPLACE FUNCTION vender_con_validacion(
    p_id_cliente INT, p_id_empleado INT, p_id_mesa INT,
    p_id_producto INT, p_cantidad INT, p_precio NUMERIC
) RETURNS TEXT AS $$
DECLARE
    v_stock INT;
    v_id_pedido INT;
BEGIN
    -- Verificar stock ANTES de vender
    SELECT stock INTO v_stock FROM PRODUCTO WHERE id_producto = p_id_producto;

    IF v_stock < p_cantidad THEN
        -- Lanza error → ROLLBACK automático de toda la función
        RAISE EXCEPTION 'Stock insuficiente: hay % pero se piden %', v_stock, p_cantidad;
    END IF;

    -- Si hay stock, ejecutar la venta completa (atómica)
    INSERT INTO PEDIDO (id_cliente, id_empleado, id_mesa, estado, total)
    VALUES (p_id_cliente, p_id_empleado, p_id_mesa, 'Pendiente', p_cantidad * p_precio)
    RETURNING id_pedido INTO v_id_pedido;

    INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
    VALUES (v_id_pedido, p_id_producto, p_cantidad, p_precio, p_cantidad * p_precio);

    UPDATE PRODUCTO SET stock = stock - p_cantidad WHERE id_producto = p_id_producto;

    RETURN 'Venta exitosa. Pedido #' || v_id_pedido;
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------
-- PRUEBAS DE LA FUNCIÓN
-- ------------------------------------------------------------

-- PRUEBA A: venta válida → funciona y descuenta stock
SELECT vender_con_validacion(2, 3, 2, 1, 3, 3.50);
-- Resultado: "Venta exitosa. Pedido #27"

-- PRUEBA B: venta imposible → ERROR + ROLLBACK automático
SELECT vender_con_validacion(1, 1, 1, 5, 99999, 35.00);
-- Resultado: ERROR "Stock insuficiente: hay 14 pero se piden 99999"
-- El stock NO cambia porque la transacción se revirtió sola.

-- Verificar que el stock quedó intacto tras el error:
SELECT nombre, stock FROM PRODUCTO WHERE id_producto = 5;


-- ============================================================
-- EXPLICACIÓN DE ACID (para la presentación):
--   A - Atomicidad:  todo se guarda o nada (BEGIN/COMMIT/ROLLBACK)
--   C - Consistencia: el stock nunca queda negativo
--   I - Aislamiento:  cada venta no interfiere con otra
--   D - Durabilidad:  tras COMMIT, los datos persisten
-- ============================================================
