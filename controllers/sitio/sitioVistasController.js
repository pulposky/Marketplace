// =============================================
// VISTAS DEL SITIO (PÁGINAS PÚBLICAS)
// =============================================
// Renderiza las páginas públicas del marketplace:
// página principal con destacados y ofertas, detalle
// de producto, y catálogo con filtros y búsqueda.
// Cualquier visitante puede entrar, no hace falta sesión.
// =============================================

const ProductoModel = require('../../models/productoModel');
const PresentacionModel = require('../../models/presentacionModel');
const { normalizarCategorias } = require('../../utils/helpers');
const { asociarImagenesAProductos } = require('../../utils/imagenes');
const { esRolPanel } = require('../../utils/roles');
const { armarPasillos } = require('../../utils/pasillos');
const { armarInicio } = require('../../utils/inicio');
const tiendaService = require('../../services/tiendaService');

// Descuento porcentual vigente según sus fechas
const estaEnOferta = (producto) => {
    const descuento = Number(producto.descuento) || 0;
    const ahora = new Date();
    return descuento > 0
        && (!producto.fecha_inicio_oferta || ahora >= new Date(producto.fecha_inicio_oferta))
        && (!producto.fecha_fin_oferta || ahora <= new Date(producto.fecha_fin_oferta));
};

const SitioVistasController = {

    // Página principal del marketplace
    // Si el usuario es del panel admin, lo mando directo al panel
    mostrarMain: (req, res) => {
        const rol = String(req.session?.usuario?.role || '').trim().toLowerCase();

        if (esRolPanel(rol)) {
            return res.redirect('/admin');
        }

        // Cargo los productos más vendidos y todos los productos, y les asocio imágenes
        ProductoModel.obtenerDestacados((errorDestacados, destacados) => {
            const listaDestacadosRaw = (errorDestacados || !Array.isArray(destacados)) ? [] : destacados;

            ProductoModel.obtenerTodos((errorTodos, todosLosProductos) => {
                const listaTodosRaw = (errorTodos || !Array.isArray(todosLosProductos)) ? [] : todosLosProductos;

                asociarImagenesAProductos(listaDestacadosRaw, (destacadosConImagen) => {
                    asociarImagenesAProductos(listaTodosRaw, (todosConImagen) => {

                        // Si hay menos de 4 destacados, completo con productos del catálogo
                        // que no estén ya en la lista de destacados
                        if (destacadosConImagen.length < 4 && todosConImagen.length > 0) {
                            const idsDestacados = new Set(destacadosConImagen.map(p => p.id_producto));
                            const restantes = todosConImagen
                                .filter(p => !idsDestacados.has(p.id_producto) && p.estado === 'activo')
                                .sort(() => Math.random() - 0.5);

                            let i = 0;
                            while (destacadosConImagen.length < 4 && i < restantes.length) {
                                destacadosConImagen.push(restantes[i]);
                                i++;
                            }
                        }

                        // Cargo los productos en oferta vigente para la tarjeta "Ofertas activas"
                        ProductoModel.obtenerConOfertas((errorOfertas, ofertas) => {
                            const listaOfertas = (errorOfertas || !Array.isArray(ofertas)) ? [] : ofertas;

                            // Inicio por bloques: ofertas con mayor descuento primero;
                            // cada bloque toma lo suyo (utils/inicio.js)
                            const activos = todosConImagen.filter((p) => p.estado === 'activo');
                            const pasillos = armarPasillos(todosConImagen);
                            const vitrinaOfertas = activos.filter(estaEnOferta)
                                .sort((a, b) => Number(b.descuento) - Number(a.descuento));
                            const bloques = armarInicio(tiendaService.obtener().bloques_inicio, {
                                pasillos, productos: activos, destacados: destacadosConImagen, ofertas: vitrinaOfertas, ahora: new Date()
                            });

                            // Presentaciones de venta (si falla, las vistas muestran solo la unidad)
                            Promise.all([PresentacionModel.adjuntar(destacadosConImagen), PresentacionModel.adjuntar(activos)])
                                .catch(() => {})
                                .then(() => res.render('main', {
                                    destacados: destacadosConImagen,
                                    productos: todosConImagen,
                                    pasillos,
                                    bloques,
                                    ofertas: listaOfertas,
                                    usuario: req.session?.usuario || null
                                }));
                        });
                    });
                });
            });
        });
    },

    // Página de detalle de un producto (GET /producto/:id)
    // Muestra la ficha completa: foto, descripción, presentación,
    // stock y precio con oferta, además del botón para apartar.
    mostrarDetalleProducto: (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(404).render('error', { codigo: 404, mensaje: 'El producto no fue encontrado.' });
        }

        ProductoModel.obtenerPorId(id, (error, resultados) => {
            if (error) {
                console.error('Error consultando producto:', error);
                return res.status(500).render('error', { codigo: 500, mensaje: 'Error en el servidor.' });
            }
            if (!resultados || resultados.length === 0) {
                return res.status(404).render('error', { codigo: 404, mensaje: 'El producto no existe o fue eliminado.' });
            }

            const producto = resultados[0];
            if (producto.estado !== 'activo') {
                return res.status(404).render('error', { codigo: 404, mensaje: 'El producto no está disponible en este momento.' });
            }

            // Todos los productos para saber el color de la categoría (si falla, la ficha sale sin color)
            ProductoModel.obtenerTodos((errorTodos, todos) => {
                asociarImagenesAProductos([producto], (productoConImagen) => {
                    PresentacionModel.adjuntar(productoConImagen).catch(() => {}).then(() => res.render('productoDetalle', {
                        producto: productoConImagen[0],
                        pasillos: errorTodos ? [] : armarPasillos(todos),
                        usuario: req.session?.usuario || null
                    }));
                });
            });
        });
    },

    // Catálogo de productos
    // Solo muestra los activos, filtra por categoría, por texto de búsqueda,
    // solo en oferta, y ordena por precio.
    mostrarCatalogo: (req, res) => {
        const categoriasSeleccionadas = normalizarCategorias(req.query.categoria || req.query.categorias);
        const busqueda = String(req.query.busqueda || '').trim();
        const busquedaLower = busqueda.toLowerCase();
        const soloOferta = req.query.soloOferta === '1' || req.query.oferta === '1';
        const orden = String(req.query.orden || '').trim();

        ProductoModel.obtenerTodos((error, productos) => {
            const listaProductosRaw = (error || !Array.isArray(productos)) ? [] : productos;

            // Solo productos activos en el catálogo público
            let productosActivos = listaProductosRaw.filter((producto) => producto.estado === 'activo');

            // Categorías del filtro: las que realmente tienen productos activos (únicas y ordenadas)
            const categorias = [...new Set(productosActivos.map((producto) => String(producto.categoria || '').trim()).filter(Boolean))]
                .sort((a, b) => a.localeCompare(b, 'es'));

            // Si escribió algo en el buscador, filtro por nombre
            if (busquedaLower) {
                productosActivos = productosActivos.filter((producto) =>
                    producto.nombre && producto.nombre.toLowerCase().includes(busquedaLower)
                );
            }

            // Si eligió categorías, filtro; si no, muestro todos los activos
            let productosFiltrados = categoriasSeleccionadas.length > 0
                ? productosActivos.filter((producto) => categoriasSeleccionadas.includes(producto.categoria))
                : productosActivos;

            const calcularEnOferta = estaEnOferta;

            // Filtro "solo en oferta"
            if (soloOferta) {
                productosFiltrados = productosFiltrados.filter(calcularEnOferta);
            }

            // Ordenar por precio
            const calcularPrecioEfectivo = (producto) => {
                const precio = Number(producto.precio) || 0;
                const descuento = Number(producto.descuento) || 0;
                return calcularEnOferta(producto) ? precio * (1 - descuento / 100) : precio;
            };

            if (orden === 'precio-asc') {
                productosFiltrados.sort((a, b) => calcularPrecioEfectivo(a) - calcularPrecioEfectivo(b));
            } else if (orden === 'precio-desc') {
                productosFiltrados.sort((a, b) => calcularPrecioEfectivo(b) - calcularPrecioEfectivo(a));
            } else if (orden === 'nombre') {
                productosFiltrados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            }

            asociarImagenesAProductos(productosFiltrados, (productosConImagen) => {
                PresentacionModel.adjuntar(productosConImagen).catch(() => {}).then(() => res.render("productos", {
                    productos: productosConImagen,
                    categorias,
                    pasillos: armarPasillos(listaProductosRaw),
                    categoriasSeleccionadas,
                    busqueda,
                    soloOferta,
                    orden,
                    usuario: req.session?.usuario || null
                }));
            });
        });
    }
};

module.exports = SitioVistasController;
