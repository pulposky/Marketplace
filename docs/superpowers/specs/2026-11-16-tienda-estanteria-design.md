# Rediseño de la tienda del cliente: "Estantería" con inicio por bloques

Fecha: 2026-11-16 · Rama: `version-generica`

## Para qué

El Marketplace se vende a cualquier negocio (supermercado, comida rápida, ferretería, farmacia...).
Hoy las vistas del cliente se ven quietas, dejan mucho espacio vacío en monitores grandes
(ancho fijo de 1200px) y el dueño solo puede ajustar unos pocos interruptores.
El usuario quiere una tienda que llame la atención, con animaciones, que use toda la
pantalla, que no vaya lenta y que cada dueño pueda adaptar a su empresa: colores,
tipografía, imágenes, agregar secciones y cambiar los textos que vienen por defecto.

## Metas

- Dirección visual **B · Estantería** (maqueta: https://claude.ai/artifact/YGwHLjBBfcyRwceG1marik):
  cada categoría es una franja de color a todo lo ancho con su nombre de fondo y una repisa
  de productos que se desliza; menú de categorías fijo arriba que marca en cuál vas;
  banner oscuro de ofertas con reloj.
- **Por categorías, sin "pasillos"**: en las vistas del cliente no aparece "Pasillo 3" ni
  numeración. Se dice "Categorías" y se muestra cuántos productos tiene cada una.
- **Inicio armado por bloques** que el dueño agrega, quita, ordena y edita desde el panel.
- **Ancho completo** en monitores: contenido hasta ~1680px, 6 productos por repisa en pantallas anchas.
- **Animaciones** de entrada, al bajar, al pasar el mouse y en el reloj de ofertas.
- **Liviana**: sin librerías nuevas, render en el servidor, imágenes diferidas.

## No metas

- Editor de arrastrar y soltar sobre la página (descartado: pesado y fácil de romper).
- Vista previa en vivo dentro del panel (el panel tendrá un enlace "Ver la tienda").
- Armar por bloques otras páginas que no sean el inicio.
- Modo oscuro.
- Elegir el nivel de animación desde el panel (se respeta `prefers-reduced-motion` del dispositivo).

## Lo que haría que fracase aunque funcione

- Que se vea a plantilla o "hecho por IA".
- Que la página cargue lenta o se trabe en un celular de gama media.
- Que el dueño pueda dejar la tienda rota o fea (por eso los bloques son de una lista cerrada,
  sin HTML libre, y todo trae un valor por defecto).

## Restricciones

- Express 5 + EJS, CSS propio en `public/css/tienda.css`, sin framework de front. No agregar dependencias.
- CSP con nonce (helmet): todo script inline lleva `nonce="<%= cspNonce %>"`; mejor archivos en `public/js`.
- Probar solo contra `tienda_db`, nunca `sena_pdv`.
- La subida de imágenes reutiliza el patrón existente (dataURL base64, `utils/imagenValida.tipoRealImagen`,
  máximo 3 MB, jpeg/png/webp).
- La configuración se guarda en `configuracion_tienda`, igual que `apariencia` (columna TEXT con JSON,
  `asegurarTabla` agrega la columna si falta, validación por lista blanca).

## Enfoques considerados

- **A. Inicio por bloques (elegido).** El inicio es una lista de bloques de tipos fijos, cada uno con sus
  campos y textos por defecto. Cumple "agregar secciones" y sigue siendo render en el servidor.
- **B. Ampliar lo actual.** Más interruptores y textos sobre un orden fijo. Rápido, pero no permite
  secciones nuevas.
- **C. Editor visual de arrastrar y soltar.** Descartado: exige una librería grande y hace lenta la tienda y el panel.

Dirección visual: entre A·Vitrina, B·Estantería y C·Mosaico el usuario eligió **Estantería**, quitando
todo lo de "pasillo".

## Diseño

### 1. Bloques del inicio

Nueva columna `configuracion_tienda.bloques_inicio TEXT` (JSON: lista ordenada). Validación en un nuevo
`utils/bloques.js` (mismo estilo que `utils/apariencia.js`): `validarBloques(entrada)` → `{ datos } | { error }`
y `normalizarBloques(valor, apariencia)` → lista lista para la vista. Máximo 20 bloques.

Tipos (cada campo de texto con límite de largo y sin `<` ni `>`):

| Tipo | Campos | Qué se ve |
|---|---|---|
| `portada` | titulo, texto, texto_boton, enlace_boton, imagen? | Título grande que entra palabra por palabra, botón; a la derecha la pila de 3 productos flotando (destacados reales) o la imagen subida |
| `ofertas` | titulo, cantidad (4–12), con_reloj | Banner oscuro con productos en oferta y reloj hasta la oferta que vence primero (`fecha_fin_oferta`); sin fecha de fin → sin reloj |
| `categoria` | categoria (de las existentes), titulo?, cantidad (4–16) | Franja de color de la categoría con repisa deslizable y flechas |
| `categorias_auto` | cantidad_categorias (0–8) | Una franja por cada categoría con productos, las N con más productos (reemplaza `secciones_inicio`) |
| `destacados` | titulo, cantidad | Repisa de destacados |
| `banner` | imagen, titulo?, texto?, texto_boton?, enlace? | Imagen a todo lo ancho con texto encima |
| `carrusel` | — | El carrusel de avisos que ya existe (módulo Carrusel del panel) |
| `beneficios` | — (usa dirección, horario, WhatsApp de la configuración) | Franja de beneficios |
| `pasos` | titulo, 4 pasos con titulo y texto | "Cómo apartar" con textos editables |
| `texto` | titulo, texto | Bloque de texto libre (sin HTML) |

Los enlaces solo aceptan rutas internas (`/catalogo...`, `/producto/...`) o `https://`.

**Sin bloques guardados** (tiendas existentes): `normalizarBloques` arma la lista equivalente al inicio de
hoy a partir de `apariencia` (portada, beneficios, carrusel, ofertas, destacados, categorias_auto, pasos),
así nada cambia hasta que el dueño edite. Desde entonces `mostrar_beneficios`, `mostrar_ofertas`,
`mostrar_destacados`, `mostrar_pasos`, `secciones_inicio` y `texto_boton_portada` dejan de mostrarse en el
panel (siguen leyéndose solo para ese valor inicial).

### 2. Panel: "Inicio de la tienda"

Nueva sección en `configuracionTienda.ejs` (o pantalla propia en el menú lateral, en el grupo de la tienda):
lista de bloques con botones subir / bajar / editar / quitar, y "Agregar bloque" con el tipo a elegir.
Al editar se despliega el formulario del bloque con los textos por defecto ya escritos. Un solo botón
Guardar envía la lista completa a la API de configuración. Subida de imágenes:
`POST /api/admin/tienda/imagen` (mismo permiso que configuración), guarda en `public/img/upload/tienda/`
y devuelve la ruta. Reordenar con botones, sin librería de arrastre.

Colores (primario y secundario) y tipografía ya existen y se mantienen.

### 3. Vistas del cliente

Lenguaje común en todas: inicio, catálogo, detalle de producto, perfil y apartados.

- `--ancho` pasa de 1200px a ~1680px; rejillas de catálogo hasta 6 columnas.
- Tarjeta de producto: foto que se eleva al pasar el mouse, botón "Agregar/Ver" que aparece encima en
  escritorio (siempre visible en celular), etiqueta de descuento que late al cargar.
- Menú de categorías (`partials/pasillos.ejs`, renombrar a `categorias.ejs`): fijo arriba al bajar, con
  cantidad de productos en vez de número de pasillo, y marca la categoría visible en el inicio.
- Quitar la numeración en el cliente: tarjeta, menú, catálogo y detalle muestran el nombre de la categoría.
  `vocab.numerar` y `etiquetaSeccion` dejan de usarse en las vistas del cliente (y se borran si nadie más los usa).
  El color por categoría (`utils/pasillos.js`) se conserva.
- Catálogo: misma franja de categoría como cabecera, rejilla con entrada escalonada.
- Detalle, perfil y apartados: mismo encabezado y tarjetas; animación de entrada suave, sin exagerar.

### 4. Animaciones y rendimiento

- CSS puro (`@keyframes`, `transition`). Un solo `public/js/tienda-animaciones.js` pequeño para:
  revelar bloques al bajar (`IntersectionObserver`, arrancan casi visibles, nunca ocultos del todo),
  categoría activa del menú, flechas de las repisas y reloj de ofertas.
- Todo se apaga con `prefers-reduced-motion: reduce`.
- Imágenes con `loading="lazy"` salvo la portada; `width`/`height` o `aspect-ratio` para no saltar.
- Meta: Lighthouse móvil en el inicio con datos de demo, Rendimiento ≥ 90 y CLS < 0.1.

### 5. Pruebas

- `test/bloques.test.js`: validación (tipos desconocidos, textos largos, `<`/`>`, enlaces externos sin https,
  más de 20 bloques, categoría inexistente queda fuera) y el valor por defecto desde `apariencia`.
- Verificación en navegador (escritorio ancho y 390px): inicio con bloques por defecto y con bloques editados,
  subir imagen, reordenar, catálogo y detalle.

## Decisiones que tomé yo (revísalas)

- Los bloques se guardan en una columna aparte (`bloques_inicio`), no dentro de `apariencia`.
- El carrusel de avisos existente se conserva como un tipo de bloque, sin cambiar su módulo.
- El reloj de ofertas usa la fecha real de fin de la oferta más próxima; si no hay, no se muestra.
- La pila flotante de la portada usa productos destacados reales cuando no hay imagen subida.
- Las imágenes que se dejen de usar quedan en disco (sin limpieza automática por ahora).
- Reordenar con botones subir/bajar en vez de arrastrar.

## Para quien construya

Nombres exactos de clases, límites de largo de cada campo, orden por defecto fino y textos por defecto
de cada bloque.
