# Rediseño Estantería con inicio por bloques — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tienda del cliente con estilo "Estantería" a todo lo ancho, animada, por categorías sin numeración, y un inicio armado por bloques que el dueño edita desde el panel.

**Architecture:** Los bloques se guardan como JSON en `configuracion_tienda.bloques_inicio`, se validan por lista blanca en `utils/bloques.js` y se resuelven a datos de vista en el controlador del inicio; cada tipo de bloque es un partial EJS. Estilos en `public/css/tienda.css`, movimiento con CSS y un script pequeño `public/js/tiendaAnimaciones.js`.

**Tech Stack:** Node + Express 5, EJS, MySQL (mysql2), `node:test`. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-11-16-tienda-estanteria-design.md` · Maqueta: https://claude.ai/artifact/YGwHLjBBfcyRwceG1marik (dirección B)

## Global Constraints

- No agregar dependencias de npm ni librerías de front.
- Scripts inline llevan `nonce="<%= cspNonce %>"`; preferir archivos en `public/js`.
- Probar solo contra `tienda_db` (`DB_DATABASE=tienda_db PORT=3000 node server.js`), nunca `sena_pdv`.
- Imágenes: dataURL base64 jpeg/png/webp, `tipoRealImagen` debe coincidir, máximo 3 MB.
- Textos de bloques sin `<` ni `>`; máximo 20 bloques.
- En vistas del cliente no aparece "Pasillo" ni número de categoría.
- Todo movimiento se apaga con `@media (prefers-reduced-motion: reduce)`; nada queda en `opacity: 0` esperando un observer.
- Ancho de contenido `--ancho: 1680px`.
- Tests: `npm test` (todos deben pasar al final de cada tarea).

## Review Focus

1. Bloque `categoria` que apunta a una categoría borrada o renombrada → en la tienda no se pinta; en el panel se marca "Categoría no encontrada".
2. Bloque sin productos (no hay ofertas, categoría vacía) → no se pinta una franja vacía.
3. Nombre de categoría largo en el texto de fondo de la franja → sin scroll horizontal a 390px.
4. `imagen` de un bloque con una ruta que no sea `/img/upload/tienda/<archivo>` (URL externa, `../`) → se rechaza al guardar.
5. Oferta sin `fecha_fin_oferta` o ya vencida → no hay reloj; el reloj nunca muestra números negativos.

---

### Task 1: Validación y valores por defecto de los bloques

**Files:**
- Create: `utils/bloques.js`
- Test: `test/bloques.test.js`

**Interfaces:**
- Consumes: `POR_DEFECTO` de `utils/apariencia.js` (forma del objeto apariencia).
- Produces:
  - `TIPOS_BLOQUE` (objeto congelado `tipo → { nombre, campos }`) con tipos `portada, ofertas, categoria, categorias_auto, destacados, banner, carrusel, beneficios, pasos, texto`.
  - `validarBloques(entrada: Array) → { datos: Bloque[] } | { error: string }`
  - `normalizarBloques(valor: string|Array|null, apariencia: object) → Bloque[]`
  - `bloquesPorDefecto(apariencia: object) → Bloque[]`
  - `Bloque = { tipo: string, ...campos }`; `pasos` lleva `pasos: [{ titulo, texto }] x4`.

Límites: `titulo` 80, `texto` 280, `texto_boton` 40, `enlace`/`enlace_boton` 200, `cantidad` 4–12 (`ofertas`, `destacados`), 4–16 (`categoria`), `cantidad_categorias` 0–8, `con_reloj` booleano, `categoria` 1–60. `imagen` solo `^/img/upload/tienda/[\w-]+\.(jpg|png|webp)$`. Enlaces: empiezan por `/` sin `//`, o por `https://`.

- [ ] **Step 1: Write the failing tests** en `test/bloques.test.js`:
  - `validarBloques acepta una lista válida y completa campos por defecto`: `[{tipo:'ofertas'}]` → `datos[0].cantidad === 6 && datos[0].con_reloj === true`.
  - `validarBloques rechaza tipo desconocido, HTML, más de 20 y no-arreglo`: `{tipo:'video'}`, `{tipo:'texto', texto:'<b>'}`, 21 bloques `texto`, `null` → todos `.error`.
  - `validarBloques valida enlaces e imágenes`: `enlace:'javascript:alert(1)'`, `enlace:'//otro.com'`, `imagen:'https://x.com/a.png'`, `imagen:'/img/upload/tienda/../x.png'` → `.error`; `enlace:'/catalogo?soloOferta=1'` y `imagen:'/img/upload/tienda/bloque-1.webp'` → ok.
  - `validarBloques valida rangos`: `{tipo:'categoria', categoria:'Aseo', cantidad:20}` → error; `{tipo:'categoria'}` sin categoría → error.
  - `bloquesPorDefecto respeta la apariencia vieja`: con `{...POR_DEFECTO, mostrar_pasos:false, secciones_inicio:2, texto_boton_portada:'Ir'}` → tipos `['portada','beneficios','carrusel','ofertas','destacados','categorias_auto']`, `categorias_auto.cantidad_categorias === 2`, `portada.texto_boton === 'Ir'`.
  - `normalizarBloques usa los por defecto si no hay nada o el JSON está roto`: `normalizarBloques(null, ap)` y `normalizarBloques('{roto', ap)` deepEqual `bloquesPorDefecto(ap)`; y descarta bloques inválidos de un JSON guardado sin perder los válidos.

- [ ] **Step 2: Run** `node --test test/bloques.test.js` → FAIL (módulo no existe).
- [ ] **Step 3: Implement** `utils/bloques.js` con el estilo de `utils/apariencia.js` (lista blanca, `Object.prototype.hasOwnProperty`, textos recortados). Textos por defecto: portada titulo `''` (la vista cae en `tienda.eslogan`), ofertas titulo `'Ofertas de la semana'`, destacados titulo `''` (la vista cae en `vocab.destacados`), pasos titulo `'Cómo apartar'` con los 4 pasos actuales de `main.ejs` (Elige / Aparta / Paga en la tienda / Recoge).
- [ ] **Step 4: Run** `node --test test/bloques.test.js` → PASS.
- [ ] **Step 5: Commit** `feat(tienda): validación de los bloques del inicio`.

### Task 2: Guardar los bloques en la configuración

**Files:**
- Modify: `models/tiendaModel.js` (COLUMNAS, CREATE TABLE, ALTER como el de `apariencia`)
- Modify: `database/schema.sql` (columna `bloques_inicio TEXT DEFAULT NULL` después de `apariencia`)
- Modify: `services/tiendaService.js` (`validarConfiguracion`, `normalizar`)
- Test: `test/tiendaService.test.js` (crear si no existe; si existe, agregar casos)

**Interfaces:**
- Consumes: `validarBloques`, `normalizarBloques` (Task 1).
- Produces: `tiendaService.obtener().bloques_inicio: Bloque[]` (siempre lista normalizada); `validarConfiguracion({ bloques_inicio: [...] })` → `datos.bloques_inicio` como texto JSON.

- [ ] **Step 1: Write the failing tests**: `validarConfiguracion guarda bloques como JSON` (`JSON.parse(datos.bloques_inicio)[0].tipo === 'texto'`), `validarConfiguracion devuelve el error de bloques` (`{bloques_inicio:[{tipo:'video'}]}` → `.error`). Si el servicio no se puede cargar sin BD, probar solo `validarConfiguracion` importándolo como hacen los tests existentes.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**. En `normalizar`, `resultado.bloques_inicio = normalizarBloques(fila?.bloques_inicio, resultado.apariencia)`; también cuando `fila` es null.
- [ ] **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat(tienda): columna bloques_inicio en la configuración`.

### Task 3: Subir imágenes de bloques

**Files:**
- Modify: `controllers/admin/tiendaApiController.js` (nuevo `subirImagenBloque`)
- Modify: `routes/admin.js` (junto a `/api/admin/tienda/logo`)

**Interfaces:**
- Produces: `POST /api/admin/tienda/imagen` (rol superadmin, igual que logo), body `{ imagen: dataURL }` → `{ ok: true, ruta: '/img/upload/tienda/bloque-<Date.now()>.<ext>' }` o `{ ok:false, mensaje }` con 400/500. No guarda la configuración (la ruta se guarda al guardar los bloques).

- [ ] **Step 1: Implement** copiando las validaciones de `subirLogo` (máximo 3 MB, `tipoRealImagen`), carpeta `public/img/upload/tienda`, `auditoriaService.registrar(req, 'tienda_imagen', ...)`.
- [ ] **Step 2: Verify** con el servidor arriba y sesión de superadmin: subir un PNG → 200 y el archivo existe; subir un `.txt` renombrado a PNG → 400.
- [ ] **Step 3: Commit** `feat(panel): subir imágenes para los bloques del inicio`.

### Task 4: Por categorías, sin numeración

**Files:**
- Modify: `utils/tipoNegocio.js` (quitar `numerar` y `etiquetaSeccion`), `test/tipoNegocio.test.js` (quitar su test)
- Rename: `public/views/partials/pasillos.ejs` → `public/views/partials/categorias.ejs` y actualizar los `include`
- Modify: `public/views/partials/tarjetaProducto.ejs:32`, `public/views/productoDetalle.ejs:34`, `public/views/productos.ejs:27`, `public/views/main.ejs:75`
- Modify: `controllers/sitio/sitioVistasController.js:122` (solo el comentario)

**Interfaces:**
- Produces: partial `categorias` con parámetros `{ pasillos, activas? }` (se mantiene el nombre de variable `pasillos` y `utils/pasillos.js` para no tocar controladores). Cada enlace muestra `nombre` y `<small>${total} productos</small>`.

- [ ] **Step 1:** `grep -rn "numerar\|etiquetaSeccion\|partials/pasillos" --include=*.js --include=*.ejs .` (sin node_modules) y cambiar cada aparición: la etiqueta de la tarjeta y del detalle muestra `pasillo.nombre`.
- [ ] **Step 2: Run** `npm test` → PASS; el mismo grep → sin resultados.
- [ ] **Step 3: Commit** `refactor(tienda): categorías sin numeración de pasillos`.

### Task 5: Inicio que pinta los bloques

**Files:**
- Create: `utils/inicio.js`, `test/inicio.test.js`
- Create: `public/views/partials/bloques/{portada,ofertas,categoria,destacados,banner,carrusel,beneficios,pasos,texto}.ejs`
- Modify: `controllers/sitio/sitioVistasController.js` (función del inicio, líneas ~39-95)
- Modify: `public/views/main.ejs` (reemplazar el contenido de `<main>` por el recorrido de bloques)

**Interfaces:**
- Consumes: `tiendaService.obtener().bloques_inicio` (Task 2), `armarPasillos` (`utils/pasillos.js`).
- Produces: `armarInicio(bloques, { pasillos, productos, destacados, ofertas, ahora: Date }) → BloqueVista[]`, donde `BloqueVista = { tipo, ...campos, productos?: Producto[], pasillo?: {nombre,color,total}, finOferta?: string(ISO) }`. Reglas:
  - `categorias_auto` se expande en N bloques `categoria` (las N con más productos, como hoy).
  - `categoria` sin `pasillo` encontrado o sin productos → se omite. `ofertas`/`destacados` sin productos → se omite.
  - `ofertas.finOferta` = la `fecha_fin_oferta` más próxima que sea futura entre los productos mostrados; si `con_reloj` es false o no hay ninguna → `null`.
  - Los demás tipos pasan tal cual.
- La vista recibe `bloques` (BloqueVista[]) además de lo que ya recibía.

- [ ] **Step 1: Write the failing tests** en `test/inicio.test.js`: `expande categorias_auto en las N categorías más grandes`, `omite una categoría inexistente`, `omite ofertas y categorías sin productos`, `finOferta es la fecha futura más próxima` (dos fechas futuras y una pasada → la futura menor), `finOferta es null sin fechas o con con_reloj false`.
- [ ] **Step 2: Run** `node --test test/inicio.test.js` → FAIL.
- [ ] **Step 3: Implement** `utils/inicio.js`; luego el controlador llama `armarInicio` y pasa `bloques` a `res.render('main', …)`. Quitar el cálculo de `secciones` con `secciones_inicio`.
- [ ] **Step 4: Implement** los partials. Marcado como la maqueta B: `portada` (`<h1>` con cada palabra en `<span style="--i:n">`, botón, pila de 3 destacados flotando o `<img>` si hay `imagen`, sin `loading=lazy`), `categoria` (`<section class="banda" style="--k:color" id="cat-<slug>">` con nombre de fondo `.banda-fondo`, cabecera con total y "Ver todos", `.estante` deslizable con flechas, `.repisa`), `ofertas` (banda oscura, `<div class="reloj" data-fin="ISO">` solo si `finOferta`), `banner` (imagen a todo lo ancho, `loading="lazy"`, texto encima), los demás reutilizan el marcado actual de `main.ejs`. Productos con `partials/tarjetaProducto`.
- [ ] **Step 5: Run** `npm test` → PASS; con el servidor arriba `curl -s localhost:3000/ | grep -c 'class="banda'` > 0.
- [ ] **Step 6: Commit** `feat(tienda): el inicio se arma con los bloques configurados`.

### Task 6: Estilo Estantería y animaciones en todas las vistas del cliente

**Files:**
- Modify: `public/css/tienda.css`
- Create: `public/js/tiendaAnimaciones.js`
- Modify: `public/views/{main,productos,productoDetalle,perfil,verApartados}.ejs` (incluir el script con `defer`; clases de entrada)
- Modify: `public/views/partials/tarjetaProducto.ejs` (botón que aparece al pasar el mouse en escritorio)

**Interfaces:**
- Consumes: marcado de Task 4 y 5 (`.banda`, `.estante`, `.repisa`, `.reloj[data-fin]`, `#cat-<slug>`, partial `categorias`).
- Produces: clases `.e` (entrada con `--i` para el retraso), `.revelar` (al bajar); `tiendaAnimaciones.js` sin dependencias, < 5 KB, que: marca `.visto` al entrar en pantalla (`IntersectionObserver`), marca la categoría activa en el menú fijo, mueve `.estante` con las flechas (`scrollBy` 80 % del ancho), y actualiza cada `.reloj[data-fin]` cada segundo (días/horas/min/seg con `Math.max(0, …)`; en 0 oculta el reloj).

- [ ] **Step 1: Implement** CSS: `--ancho: 1680px`; menú de categorías `position: sticky` con `top: 0`; `.banda` con fondo `color-mix(in srgb, var(--k) 9%, var(--base))`; `.banda-fondo` con `white-space: nowrap; overflow: hidden; max-width: 100%` (Review Focus 3); `.estante` en `grid-auto-flow: column`, 6 por vista en ≥1400px, 46 % en celular, `scroll-snap`; tarjeta con elevación y foto que crece; descuento que late 3 veces; catálogo con rejilla hasta 6 columnas; entradas que arrancan en `opacity: .25` (nunca 0); bloque `prefers-reduced-motion`.
- [ ] **Step 2: Implement** `tiendaAnimaciones.js` e incluirlo en las 5 vistas.
- [ ] **Step 3: Verify** en navegador (chrome-devtools) a 1680px y 390px: inicio, catálogo, detalle, perfil, apartados sin scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`), sin errores de consola ni de CSP.
- [ ] **Step 4: Commit** `feat(tienda): estilo Estantería con animaciones en las vistas del cliente`.

### Task 7: Editor "Inicio de la tienda" en el panel

**Files:**
- Modify: `public/views/admin/configuracionTienda.ejs` (nueva sección; quitar del formulario los interruptores `mostrar_beneficios`, `mostrar_ofertas`, `mostrar_destacados`, `mostrar_pasos`, `secciones_inicio`, `texto_boton_portada`)
- Modify: `public/js/admin/configuracionTienda.js`
- Modify: `controllers/admin/tiendaVistasController.js` (pasar `TIPOS_BLOQUE`, `bloques_inicio` y la lista de categorías con productos)

**Interfaces:**
- Consumes: `TIPOS_BLOQUE` (Task 1), `PUT /api/admin/tienda` con `bloques_inicio` (Task 2), `POST /api/admin/tienda/imagen` (Task 3).
- Produces: UI con la lista de bloques (nombre del tipo + resumen), botones Subir / Bajar / Editar / Quitar, "Agregar bloque" con `<select>` de tipo, formulario por bloque con los valores por defecto ya escritos, selector de categoría con las existentes (Review Focus 1: si la guardada no está, se muestra "Categoría no encontrada"), campo de imagen que sube y guarda la `ruta`, y enlace "Ver la tienda" (`/`, nueva pestaña). El botón Guardar existente envía `bloques_inicio` junto con lo demás; los errores del servidor se muestran con el toast actual.

- [ ] **Step 1: Implement** la sección y su JS (DOM con `textContent`, nunca `innerHTML` con texto del dueño).
- [ ] **Step 2: Verify** en navegador como superadmin: agregar un bloque `texto`, subirlo al primer lugar, editar el título de ofertas, subir una imagen a un `banner`, guardar, recargar el panel (persiste) y abrir `/` (se ve en ese orden). Guardar un texto con `<` → mensaje de error y nada cambia.
- [ ] **Step 3: Run** `npm test` → PASS.
- [ ] **Step 4: Commit** `feat(panel): editor de bloques del inicio de la tienda`.

### Task 8: Rendimiento y revisión final

- [ ] **Step 1: Run** Lighthouse (chrome-devtools `lighthouse_audit`, móvil) sobre `http://localhost:3000/` con datos de demo. Esperado: Rendimiento ≥ 90, CLS < 0.1. Si no llega, corregir lo que señale (tamaños de imagen, fuentes, script bloqueante) y repetir.
- [ ] **Step 2: Verify** con `prefers-reduced-motion: reduce` emulado: nada se anima y todo se ve.
- [ ] **Step 3:** Capturas a 1680px y 390px del inicio y el catálogo para mostrárselas al usuario.
- [ ] **Step 4: Commit** de los ajustes, si hubo: `perf(tienda): ajustes de Lighthouse`.
