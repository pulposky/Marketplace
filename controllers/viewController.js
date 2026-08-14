const fs = require('fs');
const path = require('path');
const ProductoModel = require('../model/productoModel');

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

const normalizarCategorias = (valor) => {
    if (!valor) return [];
    const valores = Array.isArray(valor) ? valor : [valor];
    return valores.map((item) => String(item).trim()).filter(Boolean);
};

const ViewController = {
    mostrarLogin: (req, res) => {
        res.render('login');
    },

    mostrarMain: (req, res) => {
        const rol = String(req.session?.usuario?.role || '').trim().toLowerCase();

        if (rol === 'admin' || rol === 'aprendiz') {
            return res.redirect('/admin');
        }

        ProductoModel.obtenerDestacados((errorDestacados, destacados) => {
            const listaDestacadosRaw = (errorDestacados || !Array.isArray(destacados)) ? [] : destacados;

            ProductoModel.obtenerTodos((errorTodos, todosLosProductos) => {
                const listaTodosRaw = (errorTodos || !Array.isArray(todosLosProductos)) ? [] : todosLosProductos;

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

    mostrarApartado: (req, res) => {
        res.render('apartarProductos');
    },

    mostrarCatalogo: (req, res) => {
        const categoriasSeleccionadas = normalizarCategorias(req.query.categoria || req.query.categorias);

        ProductoModel.obtenerTodos((error, productos) => {
            const listaProductosRaw = (error || !Array.isArray(productos)) ? [] : productos;

            // 1. Filtrar solo los productos cuyo estado sea 'activo'
            const productosActivos = listaProductosRaw.filter((producto) => producto.estado === 'activo');

            // 2. Filtrar por categoría si el usuario seleccionó alguna
            const productosFiltrados = categoriasSeleccionadas.length > 0
                ? productosActivos.filter((producto) => categoriasSeleccionadas.includes(producto.categoria))
                : productosActivos;

            asociarImagenesAProductos(productosFiltrados, (productosConImagen) => {
                res.render("productos", {
                    productos: productosConImagen,
                    categoriasSeleccionadas,
                    usuario: req.session?.usuario || null
                });
            });
        });
    },

    mostrarMainAdmin: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }
        res.render('admin/mainAdmin', { usuario: usuarioSesion });
    },

    mostrarHabilitarProducto: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }

        ProductoModel.obtenerTodos((error, productos) => {
            const listaProductosRaw = (error || !Array.isArray(productos)) ? [] : productos;

            asociarImagenesAProductos(listaProductosRaw, (productosConImagen) => {
                res.render('admin/habilitarProducto', { 
                    usuario: usuarioSesion,
                    productos: productosConImagen 
                });
            });
        });
    },

    mostrarVerApartados: (req, res) => {
        if (!req.session || !req.session.usuario) {
            return res.redirect('/login');
        }

        const nombreCliente = req.session.usuario.nombre || req.session.usuario.documento || 'Cliente';

        ProductoModel.obtenerApartadosPorCliente(nombreCliente, (error, apartados) => {
            if (error) {
                console.error('Error al consultar apartados:', error);
                return res.status(500).send('Error en el servidor');
            }

            const listaApartadosRaw = Array.isArray(apartados) ? apartados : [];

            asociarImagenesAProductos(listaApartadosRaw, (apartadosConImagen) => {
                res.render('verApartados', { 
                    apartados: apartadosConImagen,
                    usuario: req.session.usuario 
                });
            });
        });
    }
};

module.exports = ViewController;