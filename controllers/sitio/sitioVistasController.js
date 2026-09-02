// =============================================
// VISTAS DEL SITIO (PÁGINAS PÚBLICAS)
// =============================================
// Renderiza las páginas públicas del marketplace:
// página principal con destacados y ofertas, detalle
// de producto, y catálogo con filtros y búsqueda.
// Cualquier visitante puede entrar, no hace falta sesión.
// =============================================

const ProductoModel = require('../../models/productoModel');
const { normalizarCategorias } = require('../../utils/helpers');
const { asociarImagenesAProductos } = require('../../utils/imagenes');

const SitioVistasController = {

    // Página principal del marketplace
    // Si el usuario es admin o aprendiz, lo mando directo al panel admin
    mostrarMain: (req, res) => {
        const rol = String(req.session?.usuario?.role || '').trim().toLowerCase();

        if (rol === 'admin' || rol === 'aprendiz') {
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

                            res.render("main", {
                                destacados: destacadosConImagen,
                                productos: todosConImagen,
                                ofertas: listaOfertas,
                                usuario: req.session?.usuario || null
                            });
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

            asociarImagenesAProductos([producto], (productoConImagen) => {
                res.render('productoDetalle', {
                    producto: productoConImagen[0],
                    usuario: req.session?.usuario || null
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

            // Calcular si está en oferta para el filtro y el orden
            const calcularEnOferta = (producto) => {
                const descuento = Number(producto.descuento) || 0;
                const ahora = new Date();
                return descuento > 0
                    && (!producto.fecha_inicio_oferta || ahora >= new Date(producto.fecha_inicio_oferta))
                    && (!producto.fecha_fin_oferta || ahora <= new Date(producto.fecha_fin_oferta));
            };

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
                res.render("productos", {
                    productos: productosConImagen,
                    categoriasSeleccionadas,
                    busqueda,
                    soloOferta,
                    orden,
                    usuario: req.session?.usuario || null
                });
            });
        });
    }
};

module.exports = SitioVistasController;
