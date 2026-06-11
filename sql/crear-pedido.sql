-- ============================================================
-- ENTREGABLE 1: OPERACIONES CRUD COMPLEJAS (4 pts)
-- Endpoints con logica de 3 tablas: PEDIDO + DETALLE_PEDIDO + PRODUCTO
-- Inserciones en cascada y actualizaciones vinculadas
-- ============================================================

-- ===== EJEMPLO 1: Pedido de Juan Perez (Mesa 1, Mesero Filippa) =====
INSERT INTO PEDIDO (id_cliente, id_empleado, id_mesa, estado, total)
VALUES (1, 1, 1, 'Pendiente', 0);

INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
VALUES
    (currval('pedido_id_pedido_seq'), 5, 1, 35.00, 35.00),  -- Lomo Saltado
    (currval('pedido_id_pedido_seq'), 2, 2, 5.00,  10.00),  -- Limonada x2
    (currval('pedido_id_pedido_seq'), 7, 1, 15.00, 15.00);  -- Torta Chocolate

UPDATE PEDIDO
SET total = (SELECT SUM(subtotal) FROM DETALLE_PEDIDO
             WHERE id_pedido = currval('pedido_id_pedido_seq'))
WHERE id_pedido = currval('pedido_id_pedido_seq');

UPDATE PRODUCTO SET stock = stock - dp.cantidad
FROM DETALLE_PEDIDO dp
WHERE PRODUCTO.id_producto = dp.id_producto
  AND dp.id_pedido = currval('pedido_id_pedido_seq');


-- ===== EJEMPLO 2: Pedido de Maria Garcia (Mesa 2, Mesero Ruth) =====
INSERT INTO PEDIDO (id_cliente, id_empleado, id_mesa, estado, total)
VALUES (2, 3, 2, 'Pendiente', 0);

INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
VALUES
    (currval('pedido_id_pedido_seq'), 3, 2, 25.00, 50.00),  -- Ceviche x2
    (currval('pedido_id_pedido_seq'), 1, 3, 3.50,  10.50),  -- Coca Cola x3
    (currval('pedido_id_pedido_seq'), 8, 1, 8.00,   8.00);  -- Helado Vainilla

UPDATE PEDIDO
SET total = (SELECT SUM(subtotal) FROM DETALLE_PEDIDO
             WHERE id_pedido = currval('pedido_id_pedido_seq'))
WHERE id_pedido = currval('pedido_id_pedido_seq');

UPDATE PRODUCTO SET stock = stock - dp.cantidad
FROM DETALLE_PEDIDO dp
WHERE PRODUCTO.id_producto = dp.id_producto
  AND dp.id_pedido = currval('pedido_id_pedido_seq');


-- ===== EJEMPLO 3: Pedido de Carlos Lopez (Mesa 3, Cocinero Sven) =====
INSERT INTO PEDIDO (id_cliente, id_empleado, id_mesa, estado, total)
VALUES (3, 4, 3, 'Pendiente', 0);

INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
VALUES
    (currval('pedido_id_pedido_seq'), 6, 1, 28.00, 28.00),  -- Aji de Gallina
    (currval('pedido_id_pedido_seq'), 4, 2, 18.00, 36.00),  -- Papa Huancaina x2
    (currval('pedido_id_pedido_seq'), 11, 2, 4.00,  8.00);  -- Te Frio x2

UPDATE PEDIDO
SET total = (SELECT SUM(subtotal) FROM DETALLE_PEDIDO
             WHERE id_pedido = currval('pedido_id_pedido_seq'))
WHERE id_pedido = currval('pedido_id_pedido_seq');

UPDATE PRODUCTO SET stock = stock - dp.cantidad
FROM DETALLE_PEDIDO dp
WHERE PRODUCTO.id_producto = dp.id_producto
  AND dp.id_pedido = currval('pedido_id_pedido_seq');


-- ===== EJEMPLO 4: Pedido de Ana Martinez (Mesa 4, Mesero Fiadh) =====
INSERT INTO PEDIDO (id_cliente, id_empleado, id_mesa, estado, total)
VALUES (4, 7, 4, 'Pendiente', 0);

INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
VALUES
    (currval('pedido_id_pedido_seq'), 12, 1, 20.00, 20.00),  -- Causa Rellena
    (currval('pedido_id_pedido_seq'), 9,  2, 12.00, 24.00),  -- Pan con Tamal x2
    (currval('pedido_id_pedido_seq'), 10, 1, 15.00, 15.00);  -- Caldo de Gallina

UPDATE PEDIDO
SET total = (SELECT SUM(subtotal) FROM DETALLE_PEDIDO
             WHERE id_pedido = currval('pedido_id_pedido_seq'))
WHERE id_pedido = currval('pedido_id_pedido_seq');

UPDATE PRODUCTO SET stock = stock - dp.cantidad
FROM DETALLE_PEDIDO dp
WHERE PRODUCTO.id_producto = dp.id_producto
  AND dp.id_pedido = currval('pedido_id_pedido_seq');  
