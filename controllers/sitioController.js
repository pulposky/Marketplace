// =============================================
// CONTROLADOR DEL SITIO (PÁGINAS PÚBLICAS)
// =============================================
// Renderiza la página principal y el catálogo, y
// provee el API de imágenes del carrusel. Cualquier
// visitante puede entrar acá, no hace falta sesión.
// =============================================

const fs = require('fs');
const path = require('path');
const ProductoModel = require('../models/productoModel');
const { normalizarCategorias } = require('../utils/helpers');
const { asociarImagenesAProductos } = require('../utils/imagenes');

const SitioController = {

    // GET /api/carrusel-imagenes
    // Lista las imágenes de la carpeta img/carrusel para el carousel
    // de la página principal (las lee dinámicamente, sin tocar código)
    carruselImagenes: (req, res) => {
        const carpetaCarrusel = path.join(__dirname, '..', 'public', 'img', 'carrusel');
        const extensionesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

        fs.readdir(carpetaCarrusel, (error, archivos) => {
            if (error) {
                return res.json([]);
            }
            const imagenes = archivos
                .filter(archivo => extensionesValidas.includes(path.extname(archivo).toLowerCase()))
                .sort();
            res.json(imagenes);
        });
    },

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

                        res.render("main", {
                            destacados: destacadosConImagen,
                            productos: todosConImagen,
                            usuario: req.session?.usuario || null
                        });
                    });
                });
            });
        });
    },

    // Catálogo de productos
    // Solo muestra los activos, filtra por categoría y por texto de búsqueda
    mostrarCatalogo: (req, res) => {
        const categoriasSeleccionadas = normalizarCategorias(req.query.categoria || req.query.categorias);
        const busqueda = String(req.query.busqueda || '').trim();
        const busquedaLower = busqueda.toLowerCase();

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
            const productosFiltrados = categoriasSeleccionadas.length > 0
                ? productosActivos.filter((producto) => categoriasSeleccionadas.includes(producto.categoria))
                : productosActivos;

            asociarImagenesAProductos(productosFiltrados, (productosConImagen) => {
                res.render("productos", {
                    productos: productosConImagen,
                    categoriasSeleccionadas,
                    busqueda,
                    usuario: req.session?.usuario || null
                });
            });
        });
    }
};

module.exports = SitioController;