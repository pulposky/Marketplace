// Controlador encargado de renderizar las vistas principales del marketplace.
const fs = require('fs');
const path = require('path');
const ProductoModel = require('../model/productoModel');

// Normaliza texto para comparar nombres de productos e imágenes sin importar tildes o espacios.
const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .trim()
        .toLowerCase();
};

// Asocia a cada producto una imagen si existe en la carpeta de uploads.
const asociarImagenesAProductos = (productos, callback) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'img', 'upload');

    fs.readdir(uploadDir, (err, archivos) => {
        const imagenesPorNombre = {};

        if (!err && Array.isArray(archivos)) {
            archivos.forEach((archivo) => {
                const nombreSinExtension = path.parse(archivo).name;
                const clave = normalizeText(nombreSinExtension);
                if (clave) {
                    imagenesPorNombre[clave] = archivo;
                }
            });
        }

        const productosConImagen = productos.map((producto) => {
            const nombreClave = normalizeText(producto.nombre);
            const archivoImagen = imagenesPorNombre[nombreClave] || null;
            return {
                ...producto,
                imagenUpload: archivoImagen ? `/img/upload/${archivoImagen}` : null,
            };
        });

        callback(productosConImagen);
    });
};

// Convierte los filtros de categoría en un arreglo limpio y útil para el controlador.
const normalizarCategorias = (valor) => {
    if (!valor) return [];
    const valores = Array.isArray(valor) ? valor : [valor];
    return valores.map((item) => String(item).trim()).filter(Boolean);
};

const ViewController = {
    // Muestra el formulario de login
    mostrarLogin: (req, res) => {
        res.render('login');
    },

    // Muestra la página principal con los productos destacados y el listado general.
    mostrarMain: (req, res) => {
        ProductoModel.obtenerDestacados((errorDestacados, destacados) => {
            const listaDestacadosRaw = (errorDestacados || !Array.isArray(destacados)) ? [] : destacados;

            ProductoModel.obtenerTodos((errorTodos, todosLosProductos) => {
                const listaTodosRaw = (errorTodos || !Array.isArray(todosLosProductos)) ? [] : todosLosProductos;

                // Asociar imágenes a destacados y luego a todos
                asociarImagenesAProductos(listaDestacadosRaw, (destacadosConImagen) => {
                    asociarImagenesAProductos(listaTodosRaw, (todosConImagen) => {
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

    // Renderiza una vista adicional para apartar productos, si se usa en el futuro.
    mostrarApartado: (req, res) => {
        res.render('apartarProductos');
    },

    // Renderiza el catálogo completo y aplica filtros por categoría si llegaron en la solicitud.
    mostrarCatalogo: (req, res) => {
        const categoriasSeleccionadas = normalizarCategorias(req.query.categoria || req.query.categorias);

        ProductoModel.obtenerTodos((error, productos) => {
            const listaProductosRaw = (error || !Array.isArray(productos)) ? [] : productos;
            const productosFiltrados = categoriasSeleccionadas.length > 0
                ? listaProductosRaw.filter((producto) => categoriasSeleccionadas.includes(producto.categoria))
                : listaProductosRaw;

            asociarImagenesAProductos(productosFiltrados, (productosConImagen) => {
                res.render("productos", {
                    productos: productosConImagen,
                    categoriasSeleccionadas,
                    usuario: req.session?.usuario || null
                });
            });
        });
    }
    ,

    // Vista de administración para habilitación de productos
    mostrarHabilitacionProductos: (req, res) => {
        // Solo permitir si hay sesión y rol admin o aprendiz
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }
        res.render('admin/habilitacionProductos', { usuario: usuarioSesion });
    }
};

module.exports = ViewController;