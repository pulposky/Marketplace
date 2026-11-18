/* ============================================= */
/* CATALOGODEMO.JS - CATÁLOGO GRANDE DE LA DEMO   */
/* ============================================= */
/* Genera ~2.000 productos de ferretería para que  */
/* la demo se vea como una tienda real. Cada       */
/* producto = base × medida × variante (acabado,   */
/* color, presentación). Siempre sale lo mismo:    */
/* el azar usa una semilla fija.                   */
/* ============================================= */

// Lista de medidas con factor de precio creciente: m(['10 cm', '20 cm'], .3) → [['10 cm', 1], ['20 cm', 1.3]]
const m = (lista, paso = 0.15) => lista.map((s, i) => [s, 1 + i * paso]);
const v = (lista) => lista.map((x) => (Array.isArray(x) ? x : [x, 1]));

const COLORES_MADERA = v(['blanco', ['negro', 1.05], ['roble', 1.2], ['wengué', 1.2], ['gris humo', 1.15], ['cerezo', 1.2], ['nogal', 1.2], ['haya', 1.2], ['aluminio', 1.3]]);
const COLORES_PINTURA = v(['blanco', 'negro', 'gris perla', 'beige', 'azul rey', 'rojo colonial', 'verde bosque', 'amarillo', 'terracota', 'marfil', 'café', 'naranja', 'gris oscuro', 'verde menta', 'azul cielo']);

// Por categoría: nombre de la variante (va en la descripción), variantes por defecto y bases.
// Base: n = nombre, p = precio de la medida más pequeña (COP), d = descripción, m = medidas,
// l = qué es la medida (opcional), v = variantes propias (opcional, reemplaza las de la categoría).
const CATALOGO = {
    'Bisagras': {
        etiqueta: 'Acabado',
        variantes: v(['niquelada', ['negra mate', 1.15], ['inoxidable', 1.4], ['dorada', 1.25], ['blanca', 1.1], ['bronce', 1.3]]),
        bases: [
            { n: 'Bisagra cazoleta 35 mm recta', p: 4200, l: 'Apertura', d: 'Para puerta que cubre todo el costado del mueble.', m: m(['95°', '105°', '110°', '120°', '165°', '170°'], 0.12) },
            { n: 'Bisagra cazoleta 35 mm semicurva', p: 4400, l: 'Apertura', d: 'Para dos puertas que comparten el mismo costado del mueble.', m: m(['95°', '105°', '110°', '120°', '165°', '170°'], 0.12) },
            { n: 'Bisagra cazoleta 35 mm curva', p: 4600, l: 'Apertura', d: 'Para puerta embutida dentro del cuerpo del mueble.', m: m(['95°', '105°', '110°', '120°', '165°', '170°'], 0.12) },
            { n: 'Bisagra con amortiguador', p: 9800, l: 'Apertura', d: 'Amortiguador integrado: la puerta cierra suave y sin golpe.', m: m(['95°', '105°', '110°', '120°', '165°', '170°'], 0.12) },
            { n: 'Bisagra piano', p: 9000, l: 'Largo', d: 'Bisagra continua para tapas de baúl, escritorios y puertas largas.', m: m(['30 cm', '60 cm', '90 cm', '120 cm', '150 cm', '180 cm'], 0.5) },
            { n: 'Bisagra de libro', p: 2500, l: 'Medida', d: 'Bisagra de dos alas para puertas de madera, closets y ventanas.', m: m(['2 pulgadas', '2,5 pulgadas', '3 pulgadas', '3,5 pulgadas', '4 pulgadas', '5 pulgadas'], 0.3) },
            { n: 'Bisagra invisible', p: 12000, l: 'Tamaño', d: 'Queda oculta con la puerta cerrada, para acabados limpios.', m: m(['40 mm', '60 mm', '80 mm', '100 mm'], 0.35) },
            { n: 'Bisagra para vidrio', p: 14000, l: 'Espesor de vidrio', d: 'Sujeta puertas de vidrio de vitrinas sin perforar el vidrio.', m: m(['4 mm', '5 mm', '6 mm', '8 mm'], 0.1) },
        ],
    },
    'Correderas': {
        etiqueta: 'Versión',
        variantes: v(['zincada carga 25 kg', ['zincada carga 35 kg', 1.15], ['zincada carga 45 kg', 1.35], ['negra carga 25 kg', 1.1], ['negra carga 35 kg', 1.25], ['negra carga 45 kg', 1.45]]),
        bases: [
            { n: 'Corredera telescópica', p: 16000, l: 'Largo', d: 'Precio por par. Extensión total con rodamiento de bolas.', m: m(['25 cm', '30 cm', '35 cm', '40 cm', '45 cm', '50 cm', '55 cm', '60 cm'], 0.1) },
            { n: 'Corredera oculta con amortiguador', p: 38000, l: 'Largo', d: 'Precio por par. Va debajo del cajón, no se ve y cierra con amortiguación.', m: m(['30 cm', '35 cm', '40 cm', '45 cm', '50 cm', '55 cm', '60 cm'], 0.08) },
            { n: 'Corredera de rodillo', p: 7000, l: 'Largo', d: 'Precio por par. Económica, para cajones livianos de uso diario.', m: m(['25 cm', '30 cm', '35 cm', '40 cm', '45 cm', '50 cm', '55 cm'], 0.08) },
            { n: 'Corredera push to open', p: 42000, l: 'Largo', d: 'Precio por par. El cajón se abre con un toque, sin manija.', m: m(['30 cm', '35 cm', '40 cm', '45 cm', '50 cm', '55 cm'], 0.08) },
            { n: 'Riel para puerta corrediza', p: 45000, l: 'Largo', d: 'Riel superior con carros, para puertas corredizas de closet y división.', m: m(['1 m', '1,5 m', '2 m', '2,5 m', '3 m'], 0.4) },
        ],
    },
    'Manijas y botones': {
        etiqueta: 'Acabado',
        variantes: v(['negra mate', ['níquel satinado', 1.05], ['dorada', 1.2], ['cromada', 1.05], ['cobre envejecido', 1.25], ['blanca', 1], ['oro rosa', 1.3], ['grafito', 1.15]]),
        bases: [
            { n: 'Manija barra', p: 5500, l: 'Distancia entre tornillos', d: 'Manija en aluminio para cocinas y closets. Incluye tornillos.', m: m(['96 mm', '128 mm', '160 mm', '192 mm', '224 mm', '320 mm'], 0.2) },
            { n: 'Manija de arco', p: 4800, l: 'Distancia entre tornillos', d: 'Diseño curvo clásico para cajones y puertas.', m: m(['64 mm', '96 mm', '128 mm'], 0.2) },
            { n: 'Manija cuadrada', p: 6500, l: 'Distancia entre tornillos', d: 'Líneas rectas para muebles de estilo moderno.', m: m(['96 mm', '128 mm', '160 mm', '192 mm'], 0.2) },
            { n: 'Manija embutida', p: 7500, l: 'Tamaño', d: 'Va dentro de la puerta y no sobresale, ideal para puertas corredizas.', m: m(['pequeña', 'mediana', 'grande'], 0.3) },
            { n: 'Botón redondo', p: 2500, l: 'Diámetro', d: 'Botón en zamak para cajones y puertas pequeñas.', m: m(['20 mm', '25 mm', '30 mm', '35 mm'], 0.15) },
            { n: 'Botón cuadrado', p: 2800, l: 'Lado', d: 'Botón de líneas rectas para cajones y puertas pequeñas.', m: m(['20 mm', '25 mm', '30 mm'], 0.15) },
            { n: 'Manija perfil gola', p: 28000, l: 'Largo', d: 'Perfil de aluminio que reemplaza la manija en cocinas sin tiradores.', m: m(['60 cm', '90 cm', '120 cm'], 0.45) },
        ],
    },
    'Cerraduras': {
        etiqueta: 'Acabado',
        variantes: v(['satinada', ['negra', 1.1], ['dorada', 1.2], ['cromada', 1.05], ['bronce', 1.2], ['grafito', 1.15]]),
        bases: [
            { n: 'Cerradura para cajón', p: 9500, l: 'Largo del cilindro', d: 'Cerradura de cilindro para cajones y escritorios. Trae dos llaves.', m: m(['16 mm', '20 mm', '22 mm', '28 mm', '32 mm'], 0.08) },
            { n: 'Cerradura para puerta de vidrio', p: 18000, l: 'Tipo', d: 'Para vitrinas y muebles con puerta de vidrio, sin perforar el vidrio.', m: m(['sencilla', 'doble puerta'], 0.4) },
            { n: 'Chapa de pomo', p: 32000, l: 'Uso', d: 'Pomo en acero con mecanismo de pestillo, fácil de instalar.', m: m(['de paso', 'de alcoba', 'de baño', 'de entrada'], 0.2) },
            { n: 'Chapa de manija', p: 45000, l: 'Uso', d: 'Manija tipo palanca, cómoda para niños y adultos mayores.', m: m(['de paso', 'de alcoba', 'de baño', 'de entrada'], 0.2) },
            { n: 'Cerrojo de sobreponer', p: 8000, l: 'Largo', d: 'Pasador de seguridad que se atornilla por dentro de la puerta.', m: m(['2 pulgadas', '3 pulgadas', '4 pulgadas', '6 pulgadas'], 0.25) },
            { n: 'Candado de seguridad', p: 15000, l: 'Ancho', d: 'Cuerpo sólido y arco en acero endurecido. Trae tres llaves.', m: m(['30 mm', '40 mm', '50 mm', '60 mm'], 0.35) },
            { n: 'Imán de cierre para puerta', p: 2500, l: 'Tipo', d: 'Mantiene cerrada la puerta del mueble sin necesidad de llave.', m: m(['sencillo', 'doble'], 0.5) },
        ],
    },
    'Patas y rodachinas': {
        etiqueta: 'Color',
        variantes: v(['negra', ['cromada', 1.2], ['blanca', 1], ['dorada', 1.3], ['gris', 1], ['acero inoxidable', 1.45]]),
        bases: [
            { n: 'Pata metálica cuadrada', p: 9000, l: 'Altura', d: 'Pata en tubo cuadrado con nivelador. Incluye platina y tornillos.', m: m(['10 cm', '15 cm', '40 cm', '72 cm', '90 cm'], 0.5) },
            { n: 'Pata metálica redonda', p: 8500, l: 'Altura', d: 'Pata en tubo redondo con nivelador. Incluye platina y tornillos.', m: m(['10 cm', '15 cm', '40 cm', '72 cm', '90 cm'], 0.5) },
            { n: 'Pata en horquilla', p: 28000, l: 'Altura', d: 'Pata en varilla de acero estilo industrial para mesas y bancas.', m: m(['30 cm', '40 cm', '72 cm'], 0.4) },
            { n: 'Pata niveladora para mueble', p: 3500, l: 'Altura', d: 'Base regulable que nivela el mueble en pisos disparejos.', m: m(['5 cm', '10 cm', '15 cm'], 0.3) },
            { n: 'Rodachina giratoria', p: 4500, l: 'Diámetro', d: 'Rueda de goma que no raya el piso y gira 360°.', m: m(['1,5 pulgadas', '2 pulgadas', '3 pulgadas', '4 pulgadas'], 0.4) },
            { n: 'Rodachina giratoria con freno', p: 6000, l: 'Diámetro', d: 'Gira 360° y se bloquea con el pie para que el mueble no se mueva.', m: m(['1,5 pulgadas', '2 pulgadas', '3 pulgadas', '4 pulgadas'], 0.4) },
            { n: 'Rodachina fija', p: 3800, l: 'Diámetro', d: 'Rueda de dirección fija para carros y bases que van en línea recta.', m: m(['1,5 pulgadas', '2 pulgadas', '3 pulgadas', '4 pulgadas'], 0.4) },
        ],
    },
    'Cocina': {
        etiqueta: 'Color',
        variantes: v(['gris', 'blanco', ['cromado', 1.2], ['antracita', 1.1], ['negro', 1.1], ['acero inoxidable', 1.45]]),
        bases: [
            { n: 'Cubiertero', p: 32000, l: 'Ancho del cajón', d: 'Organizador de cubiertos que se recorta a la medida del cajón.', m: m(['30 cm', '40 cm', '50 cm', '60 cm', '80 cm', '90 cm'], 0.2) },
            { n: 'Escurridor de platos para mueble', p: 65000, l: 'Ancho del mueble', d: 'Escurridor de dos niveles con bandeja para mueble alto.', m: m(['60 cm', '70 cm', '80 cm', '90 cm'], 0.12) },
            { n: 'Organizador extraíble', p: 95000, l: 'Ancho del mueble', d: 'Bandejas en riel de cierre lento para aprovechar muebles angostos.', m: m(['15 cm', '20 cm', '30 cm', '40 cm'], 0.2) },
            { n: 'Basurera extraíble', p: 180000, l: 'Capacidad', d: 'Canecas en riel de cierre lento para mueble bajo.', m: m(['1 x 15 L', '2 x 15 L', '1 x 30 L', '2 x 20 L'], 0.3) },
            { n: 'Especiero extraíble', p: 85000, l: 'Ancho del mueble', d: 'Repisas angostas para frascos de especias, con riel de cierre lento.', m: m(['15 cm', '20 cm', '25 cm'], 0.15) },
            { n: 'Botellero extraíble', p: 90000, l: 'Ancho del mueble', d: 'Canasta para botellas y aceites junto a la estufa.', m: m(['15 cm', '20 cm', '30 cm'], 0.15) },
            { n: 'Zócalo para cocina', p: 38000, l: 'Medida', d: 'Zócalo en aluminio para la base de los muebles bajos. Tramo de 3 m.', m: m(['10 cm', '12 cm', '15 cm'], 0.15) },
            { n: 'Pistón para puerta elevable', p: 7500, l: 'Fuerza', d: 'Sostiene abierta la puerta de muebles altos que abren hacia arriba.', m: m(['60 N', '80 N', '100 N', '120 N'], 0.1) },
        ],
    },
    'Closet': {
        etiqueta: 'Acabado',
        variantes: v(['cromado', ['negro', 1.1], ['blanco', 1], ['champaña', 1.2], ['grafito', 1.15], ['madera', 1.3]]),
        bases: [
            { n: 'Tubo ovalado para closet', p: 8000, l: 'Largo', d: 'Tubo para colgar ropa. Incluye sus dos soportes.', m: m(['60 cm', '80 cm', '1 m', '1,2 m', '1,5 m', '2 m'], 0.25) },
            { n: 'Soporte para tubo ovalado', p: 2500, l: 'Tipo', d: 'Repuesto para tubos de closet. Se vende por unidad.', m: m(['lateral', 'central'], 0.3) },
            { n: 'Pantalonero extraíble', p: 140000, l: 'Ancho del módulo', d: 'Bandeja con riel de cierre lento para colgar pantalones sin arrugas.', m: m(['45 cm', '60 cm', '80 cm', '90 cm'], 0.15) },
            { n: 'Corbatero extraíble', p: 75000, l: 'Largo', d: 'Riel lateral con ganchos para corbatas, cinturones y bufandas.', m: m(['30 cm', '45 cm'], 0.2) },
            { n: 'Zapatero extraíble', p: 120000, l: 'Ancho del módulo', d: 'Bandeja de dos niveles en riel para el fondo del closet.', m: m(['45 cm', '60 cm', '80 cm', '90 cm'], 0.15) },
            { n: 'Colgador abatible para closet', p: 210000, l: 'Ancho', d: 'Baja el tubo de ropa hasta la mano en closets muy altos.', m: m(['60 cm', '80 cm', '1 m', '1,2 m'], 0.12) },
            { n: 'Gancho para ropa', p: 1800, l: 'Tipo', d: 'Gancho de pared o puerta para toallas, bolsos y chaquetas.', m: m(['sencillo', 'doble', 'triple'], 0.4) },
            { n: 'Repisa flotante', p: 35000, l: 'Largo', d: 'Repisa con soporte oculto: no se ven tornillos ni escuadras.', m: m(['40 cm', '60 cm', '80 cm', '1 m'], 0.3) },
            { n: 'Canasta extraíble para closet', p: 95000, l: 'Ancho del módulo', d: 'Canasta en riel para ropa doblada, accesorios o lavandería.', m: m(['45 cm', '60 cm', '80 cm'], 0.15) },
        ],
    },
    'Herramientas': {
        etiqueta: 'Línea',
        variantes: v(['hogar', ['profesional', 1.6], ['kit con estuche', 1.3]]),
        bases: [
            { n: 'Taladro percutor', p: 150000, l: 'Potencia', d: 'Taladro con percutor para madera, metal y concreto.', m: m(['500 W', '650 W', '800 W', '1000 W'], 0.25) },
            { n: 'Atornillador inalámbrico', p: 180000, l: 'Batería', d: 'Atornilla y perfora sin cable. Incluye cargador.', m: m(['12 V', '18 V', '20 V'], 0.3) },
            { n: 'Sierra caladora', p: 160000, l: 'Potencia', d: 'Corta curvas y rectas en madera, MDF y láminas delgadas.', m: m(['450 W', '600 W', '800 W'], 0.25) },
            { n: 'Lijadora orbital', p: 140000, l: 'Potencia', d: 'Deja las superficies lisas antes de pintar o barnizar.', m: m(['200 W', '300 W'], 0.25) },
            { n: 'Juego de brocas para madera', p: 18000, l: 'Piezas', d: 'Brocas con punta de centrado para perforaciones limpias en madera.', m: m(['x5', 'x7', 'x10'], 0.35) },
            { n: 'Juego de brocas para metal', p: 25000, l: 'Piezas', d: 'Brocas HSS para lámina, aluminio y hierro.', m: m(['x10', 'x13', 'x19'], 0.35) },
            { n: 'Juego de brocas para concreto', p: 22000, l: 'Piezas', d: 'Punta de tungsteno para muros, ladrillo y concreto.', m: m(['x5', 'x8'], 0.4) },
            { n: 'Juego de puntas para atornillar', p: 15000, l: 'Piezas', d: 'Puntas de estrella, pala y torx con adaptador magnético.', m: m(['x10', 'x32', 'x50'], 0.5) },
            { n: 'Destornillador de pala', p: 6000, l: 'Medida', d: 'Mango ergonómico antideslizante y punta imantada.', m: m(['1/8 pulgada', '3/16 pulgada', '1/4 pulgada', '5/16 pulgada'], 0.12) },
            { n: 'Destornillador de estrella', p: 6000, l: 'Medida', d: 'Mango ergonómico antideslizante y punta imantada.', m: m(['PH0', 'PH1', 'PH2', 'PH3'], 0.12) },
            { n: 'Martillo de uña', p: 18000, l: 'Peso', d: 'Cabeza forjada y mango antivibración.', m: m(['8 oz', '16 oz', '20 oz'], 0.25) },
            { n: 'Flexómetro', p: 9000, l: 'Largo', d: 'Cinta métrica con freno y gancho imantado.', m: m(['3 m', '5 m', '8 m'], 0.4) },
            { n: 'Escuadra metálica', p: 12000, l: 'Largo', d: 'Escuadra de 90° para trazar y armar muebles a escuadra.', m: m(['20 cm', '30 cm', '60 cm'], 0.4) },
            { n: 'Prensa en C', p: 12000, l: 'Apertura', d: 'Sujeta piezas mientras seca el pegante o mientras se perfora.', m: m(['2 pulgadas', '4 pulgadas', '6 pulgadas', '8 pulgadas'], 0.3) },
            { n: 'Formón para madera', p: 14000, l: 'Ancho', d: 'Hoja de acero templado para rebajes, bisagras y ensambles.', m: m(['6 mm', '12 mm', '19 mm', '25 mm'], 0.15) },
            { n: 'Juego de llaves Allen', p: 12000, l: 'Piezas', d: 'Llaves hexagonales en L para armar muebles.', m: m(['x7', 'x9'], 0.3) },
        ],
    },
    'Tornillería': {
        etiqueta: 'Presentación',
        variantes: v([['bolsa x50', 0.6], 'caja x100', ['caja x500', 4.5], ['caja x1000', 8.5]]),
        bases: [
            { n: 'Tornillo para madera', p: 4500, l: 'Medida', d: 'Autorroscante cabeza plana para aglomerado, MDF y madera.', m: m(['6 x 1/2 pulgada', '6 x 3/4 pulgada', '6 x 1 pulgada', '8 x 1 1/2 pulgada', '8 x 2 pulgadas', '10 x 2 pulgadas', '10 x 3 pulgadas'], 0.25) },
            { n: 'Tornillo para drywall', p: 4000, l: 'Medida', d: 'Punta fina y cabeza de corneta para placas de yeso.', m: m(['6 x 1 pulgada', '6 x 1 1/4 pulgada', '6 x 2 pulgadas', '8 x 3 pulgadas'], 0.25) },
            { n: 'Tornillo para lámina', p: 5000, l: 'Medida', d: 'Autoperforante para lámina metálica y perfiles.', m: m(['8 x 1/2 pulgada', '8 x 3/4 pulgada', '10 x 1 pulgada'], 0.25) },
            { n: 'Tornillo confirmat', p: 9000, l: 'Medida', d: 'Tornillo de ensamble para muebles en aglomerado.', m: m(['7 x 50 mm', '7 x 70 mm'], 0.3) },
            { n: 'Chazo plástico', p: 3000, l: 'Medida', d: 'Para fijar tornillos en muros de ladrillo y concreto.', m: m(['1/4 pulgada', '5/16 pulgada', '3/8 pulgada'], 0.3) },
            { n: 'Perno con tuerca', p: 15000, l: 'Medida', d: 'Perno galvanizado con tuerca para uniones que se desarman.', m: m(['1/4 x 1 pulgada', '1/4 x 2 pulgadas', '5/16 x 2 pulgadas', '3/8 x 3 pulgadas'], 0.35) },
            { n: 'Arandela plana', p: 2500, l: 'Medida', d: 'Reparte la presión del tornillo y protege la superficie.', m: m(['1/4 pulgada', '5/16 pulgada', '3/8 pulgada'], 0.3) },
            { n: 'Puntilla con cabeza', p: 2000, l: 'Largo', d: 'Puntilla de acero para carpintería general.', m: m(['1 pulgada', '1 1/2 pulgada', '2 pulgadas', '2 1/2 pulgadas', '3 pulgadas'], 0.25) },
            { n: 'Tuerca hexagonal', p: 2800, l: 'Medida', d: 'Tuerca galvanizada de rosca ordinaria.', m: m(['1/4 pulgada', '5/16 pulgada', '3/8 pulgada'], 0.3) },
            { n: 'Remache pop', p: 4500, l: 'Medida', d: 'Remache de aluminio para unir láminas por un solo lado.', m: m(['1/8 x 1/4 pulgada', '1/8 x 1/2 pulgada', '3/16 x 1/2 pulgada'], 0.3) },
        ],
    },
    'Pegantes y cantos': {
        etiqueta: 'Tipo',
        variantes: v(['estándar']),
        bases: [
            { n: 'Pegante para madera', p: 6000, l: 'Contenido', d: 'Pegante blanco para uniones de madera y MDF.', m: m(['250 g', '500 g', '1 kg', '4 kg'], 0.9), v: v(['secado rápido', ['extra fuerte', 1.3], ['resistente al agua', 1.5]]) },
            { n: 'Pegante de contacto', p: 9000, l: 'Contenido', d: 'Para pegar fórmica, cuero, caucho y enchapes.', m: m(['1/16 galón', '1/8 galón', '1/4 galón', '1 galón'], 1), v: v(['estándar', ['sin tolueno', 1.1]]) },
            { n: 'Silicona 280 ml', p: 11000, l: 'Presentación', d: 'Sella juntas en cocinas, baños y ventanas.', m: m(['cartucho', 'paquete x3'], 1.7), v: v(['transparente', 'blanca', ['negra', 1.05], ['antihongos', 1.3], ['alta temperatura', 1.6]]) },
            { n: 'Canto PVC', p: 700, l: 'Ancho', d: 'Canto para tapar el borde de tableros. Se vende por metro.', m: m(['22 mm', '33 mm', '45 mm'], 0.35), v: COLORES_MADERA },
            { n: 'Canto ABS 2 mm', p: 1500, l: 'Ancho', d: 'Canto grueso de alta resistencia a golpes. Se vende por metro.', m: m(['22 mm', '33 mm', '45 mm'], 0.35), v: COLORES_MADERA },
            { n: 'Masilla para madera', p: 7000, l: 'Contenido', d: 'Tapa huecos, grietas y cabezas de puntilla antes de pintar.', m: m(['250 g', '500 g'], 0.7), v: v(['natural', 'cedro', 'caoba', 'wengué', 'blanca']) },
            { n: 'Lija para madera', p: 1200, l: 'Grano', d: 'Lija de óxido de aluminio para madera y masilla.', m: m(['grano 80', 'grano 100', 'grano 120', 'grano 150', 'grano 180', 'grano 220', 'grano 320'], 0), v: v(['pliego', ['paquete x10', 8.5]]) },
            { n: 'Barniz para madera', p: 32000, l: 'Contenido', d: 'Protege y resalta la veta de la madera en interiores.', m: m(['1/4 galón', '1 galón'], 2.4), v: v(['brillante', 'mate', 'semimate']) },
            { n: 'Tinte para madera', p: 18000, l: 'Contenido', d: 'Da color a la madera sin tapar la veta.', m: m(['1/4 galón', '1 galón'], 2.4), v: v(['caoba', 'nogal', 'wengué', 'cedro', 'roble']) },
        ],
    },
    'Iluminación LED': {
        etiqueta: 'Versión',
        variantes: v(['luz cálida', 'luz fría']),
        bases: [
            { n: 'Tira LED', p: 12000, l: 'Largo', d: 'Tira adhesiva de 12 V para debajo de gabinetes y repisas.', m: m(['1 m', '2 m', '3 m', '5 m', '10 m'], 0.8), v: v(['luz cálida', 'luz fría', 'luz neutra', ['RGB', 1.4]]) },
            { n: 'Perfil de aluminio para tira LED', p: 14000, l: 'Largo', d: 'Protege la tira y difumina la luz para que no se vean los puntos.', m: m(['1 m', '2 m', '3 m'], 0.9), v: v(['de sobreponer', ['embutido', 1.2], ['esquinero', 1.1]]) },
            { n: 'Fuente de poder 12 V', p: 15000, l: 'Corriente', d: 'Alimenta tiras y luces LED de 12 V.', m: m(['1 A', '2 A', '5 A', '10 A'], 0.6), v: v(['para interior', ['para exterior', 1.5]]) },
            { n: 'Luz LED para closet con sensor', p: 28000, l: 'Largo', d: 'Se enciende sola al abrir la puerta. Recargable por USB.', m: m(['20 cm', '30 cm', '40 cm', '60 cm'], 0.3) },
            { n: 'Foco LED de sobreponer para mueble', p: 16000, l: 'Forma', d: 'Foco delgado para vitrinas, repisas y gabinetes.', m: m(['redondo', 'cuadrado'], 0.1), v: v(['luz cálida, plateado', ['luz cálida, negro', 1.1], 'luz fría, plateado', ['luz fría, negro', 1.1]]) },
            { n: 'Bombillo LED', p: 5000, l: 'Potencia', d: 'Rosca E27, ahorra hasta 80 % de energía.', m: m(['5 W', '9 W', '12 W', '15 W', '20 W'], 0.35) },
            { n: 'Interruptor para tira LED', p: 12000, l: 'Tipo', d: 'Enciende y apaga las luces del mueble sin tocar el tomacorriente.', m: m(['de toque', 'con sensor de movimiento', 'con control remoto'], 0.4), v: v(['blanco', 'negro']) },
        ],
    },
    'Pinturas': {
        etiqueta: 'Color',
        variantes: COLORES_PINTURA,
        bases: [
            { n: 'Vinilo tipo 1', p: 22000, l: 'Contenido', d: 'Pintura lavable para muros interiores, buen cubrimiento.', m: m(['1/4 galón', '1 galón', 'cuñete 5 galones'], 2.2) },
            { n: 'Esmalte sintético', p: 26000, l: 'Contenido', d: 'Para madera y metal en interiores y exteriores, acabado brillante.', m: m(['1/4 galón', '1 galón'], 2.4) },
            { n: 'Pintura en aerosol', p: 14000, l: 'Contenido', d: 'Secado rápido para retoques en madera, metal y plástico.', m: m(['300 ml', '400 ml'], 0.25) },
            { n: 'Laca para madera', p: 30000, l: 'Contenido', d: 'Acabado duro y uniforme para muebles.', m: m(['1/4 galón', '1 galón'], 2.4), v: v(['brillante', 'mate', 'semimate', 'transparente']) },
            { n: 'Rodillo de felpa', p: 9000, l: 'Ancho', d: 'Rodillo con mango para muros y superficies grandes.', m: m(['3 pulgadas', '6 pulgadas', '9 pulgadas'], 0.4), v: v(['pelo corto', ['pelo largo', 1.1]]) },
            { n: 'Brocha', p: 3500, l: 'Ancho', d: 'Para esmaltes, barnices y retoques.', m: m(['1 pulgada', '2 pulgadas', '3 pulgadas', '4 pulgadas'], 0.5), v: v(['cerda natural', ['cerda sintética', 1.2]]) },
            { n: 'Cinta de enmascarar', p: 3500, l: 'Ancho', d: 'Protege bordes al pintar y se retira sin dejar residuo.', m: m(['18 mm', '24 mm', '36 mm', '48 mm'], 0.35), v: v(['rollo x 40 m', ['rollo x 50 m', 1.2]]) },
        ],
    },
};

// Azar con semilla (mulberry32): la demo sale igual cada vez
const azar = (semilla) => () => {
    semilla = (semilla + 0x6D2B79F5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const redondear = (n) => Math.max(100, Math.round(n / (n < 10000 ? 100 : 500)) * (n < 10000 ? 100 : 500));

// Todas las combinaciones de una categoría, en orden base → medida → variante.
const combinaciones = (categoria) => {
    const { etiqueta, variantes, bases } = CATALOGO[categoria];
    const lista = [];
    for (const b of bases) {
        for (const [medida, fm] of b.m) {
            for (const [variante, fv] of (b.v || variantes)) {
                lista.push({
                    nombre: `${b.n} ${medida} ${variante}`,
                    precio: redondear(b.p * fm * fv),
                    categoria,
                    descripcion: `${b.d} ${b.l || 'Medida'}: ${medida}. ${etiqueta}: ${variante}.`,
                });
            }
        }
    }
    return lista;
};

// Genera `cantidad` productos repartidos por igual entre las categorías (turnos), sin repetir
// ningún nombre de `excluir`. Devuelve filas [nombre, unidad, precio, stock, categoría, descripción, extras]
// con el mismo formato que la lista a mano de seed.js.
const generarCatalogo = (cantidad, excluir = []) => {
    const usados = new Set(excluir.map((n) => n.toLowerCase()));
    const colas = Object.keys(CATALOGO).map(combinaciones);
    const elegir = azar(20261118);
    const filas = [];
    while (filas.length < cantidad && colas.some((c) => c.length)) {
        for (const cola of colas) {
            const p = cola.shift();
            if (!p || usados.has(p.nombre.toLowerCase()) || filas.length >= cantidad) continue;
            usados.add(p.nombre.toLowerCase());
            const r = elegir();
            const stock = r < 0.05 ? 0 : Math.floor(3 + elegir() * (p.categoria === 'Tornillería' ? 400 : 120));
            const extras = {};
            if (elegir() < 0.07) extras.descuento = [10, 15, 20, 25][Math.floor(elegir() * 4)];
            if (elegir() < 0.015) extras.inactivo = true;
            filas.push([p.nombre, p.nombre.startsWith('Canto') ? 'M' : 'UND', p.precio, stock, p.categoria, p.descripcion, extras]);
        }
    }
    if (filas.length < cantidad) throw new Error(`El catálogo demo solo alcanza para ${filas.length} productos (se pidieron ${cantidad}).`);
    return filas;
};

module.exports = { generarCatalogo, CATEGORIAS_CATALOGO: Object.keys(CATALOGO) };
