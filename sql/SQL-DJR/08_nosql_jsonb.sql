-- ============================================================
-- ENTREGABLE 2 - TAREA 3: CASO NoSQL / HÍBRIDO con JSONB (2.5 pts)
-- Responsable: Persona 3
-- ============================================================
-- Objetivo: Usar datos semi-estructurados (JSONB) y justificar
-- por qué es mejor que el modelo relacional puro para este caso.
-- ============================================================

-- ------------------------------------------------------------
-- CONTEXTO: La tabla DOCUMENTO guarda boletas/facturas.
-- La columna "datos_json" (tipo JSONB) almacena una "foto"
-- completa del documento al momento de emitirlo.
-- ------------------------------------------------------------

-- Estructura de la columna JSONB (ya existe en la tabla DOCUMENTO):
-- datos_json = {
--   "cliente": "Juan Perez",
--   "dni": "12345678",
--   "items": [
--     {"nombre": "Lomo Saltado", "cantidad": 2, "subtotal": 70.00},
--     {"nombre": "Coca Cola", "cantidad": 2, "subtotal": 6.00}
--   ],
--   "subtotal": 76.00, "igv": 13.68, "total": 89.68
-- }


-- ------------------------------------------------------------
-- INSERTAR documentos de ejemplo con JSONB
-- ------------------------------------------------------------
INSERT INTO DOCUMENTO (tipo, numero, id_cliente, subtotal, igv, total, datos_json)
VALUES
('boleta', generar_numero_documento('boleta'), 1, 76.00, 13.68, 89.68,
 '{"cliente": "Juan Perez", "dni": "12345678",
   "items": [
     {"nombre": "Lomo Saltado", "cantidad": 2, "precio_unitario": 35.00, "subtotal": 70.00},
     {"nombre": "Coca Cola 500ml", "cantidad": 2, "precio_unitario": 3.50, "subtotal": 6.00}
   ], "subtotal": 76.00, "igv": 13.68, "total": 89.68}'::jsonb);


-- ------------------------------------------------------------
-- CONSULTAS NoSQL CON OPERADORES JSONB
-- ------------------------------------------------------------

-- 1. Operador ->>  extrae un campo como TEXTO
SELECT numero,
       datos_json->>'cliente' AS cliente,
       datos_json->>'total'   AS total
FROM DOCUMENTO;

-- 2. Operador ->   navega dentro del JSON (devuelve otro JSON)
SELECT numero, datos_json->'items' AS lista_items
FROM DOCUMENTO;

-- 3. jsonb_array_elements: EXPANDIR un array a filas
--    (cada producto del documento se vuelve una fila)
SELECT d.numero,
       item->>'nombre'   AS producto,
       item->>'cantidad' AS cantidad,
       item->>'subtotal' AS subtotal
FROM DOCUMENTO d,
     jsonb_array_elements(d.datos_json->'items') AS item;

-- 4. Filtrar por un valor DENTRO del JSON
SELECT numero, datos_json->>'cliente' AS cliente
FROM DOCUMENTO
WHERE datos_json->>'dni' = '12345678';

-- 5. Operador @>  ¿el JSON contiene cierto valor?
SELECT numero
FROM DOCUMENTO
WHERE datos_json @> '{"cliente": "Juan Perez"}'::jsonb;

-- 6. Índice GIN para acelerar búsquedas dentro del JSONB
CREATE INDEX idx_documento_json ON DOCUMENTO USING GIN (datos_json);


-- ============================================================
-- JUSTIFICACIÓN: ¿Por qué JSONB y no tablas relacionales?
-- ============================================================
-- 1. INMUTABILIDAD HISTÓRICA: una boleta debe quedar EXACTA como
--    se emitió. Si el precio de un producto cambia mañana, la
--    boleta vieja NO debe cambiar. Con JSONB guardamos una "foto"
--    congelada; con tablas relacionales un JOIN mostraría el
--    precio nuevo (incorrecto legalmente).
--
-- 2. FLEXIBILIDAD: distintos tipos de documento (boleta, factura,
--    cotización) pueden tener campos diferentes sin alterar el
--    esquema de la tabla.
--
-- 3. MENOS JOINS: todo el documento está en una sola fila. No se
--    necesita unir 4 tablas para reconstruir una boleta.
--
-- 4. LO MEJOR DE LOS DOS MUNDOS (modelo híbrido): mantenemos
--    columnas relacionales (id_cliente, total) para reportes
--    rápidos Y el JSONB para el detalle flexible.
-- ============================================================
