// =============================================
// CONTROLADOR DE VISTAS
// =============================================
// Se encarga de renderizar todas las páginas
// del proyecto. Cada función obtiene los datos
// necesarios de la BD y luego hace res.render()
// con la plantilla EJS correspondiente.
//
// También tiene la función para asociar imágenes
// subidas a los productos según su nombre.
// =============================================

const fs = require('fs');
const path = require('path');
const ProductoModel = require('../model/productoModel');

// Quita tildes, caracteres especiales y convierte a minúsculas.
// Lo uso para comparar nombres de producto con nombres de archivo de imagen.
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

// Busca en la carpeta /img/upload las imágenes que coincidan
// con el nombre del producto y las adjunta al objeto producto.
const asociarImagenesAProductos = (productos, callback) => {
    const uploadDir = path.join(__dirname, '..', 'public', 'img', 'upload');

    fs.readdir(uploadDir, (err, archivos) => {
        const imagenesPorNombre = {};

        // Armo un diccionario: nombre-normalizado → nombre-archivo
        if (!err && Array.isArray(archivos)) {
            archivos.forEach((archivo) => {
                const nombreSinExtension = path.parse(archivo).name;
                const clave = normalizeText(nombreSinExtension);
                if (clave) {
                    imagenesPorNombre[clave] = archivo;
                }
            });
        }

        // A cada producto le agrego la ruta de su imagen si existe
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

// Convierte el parámetro de categorías (puede venir como string o array) a un array limpio
const normalizarCategorias = (valor) => {
    if (!valor) return [];
    const valores = Array.isArray(valor) ? valor : [valor];
    return valores.map((item) => String(item).trim()).filter(Boolean);
};

const ViewController = {

    // Página de login (aunque actualmente el login está en un modal)
    mostrarLogin: (req, res) => {
        res.render('login');
    },

    // Página principal del marketplace
    // Si el usuario es admin o aprendiz, lo mando directo al panel admin
    mostrarMain: (req, res) => {
        const rol = String(req.session?.usuario?.role || '').trim().toLowerCase();

        if (rol === 'admin' || rol === 'aprendiz') {
            return res.redirect('/admin');
        }

        // Primero cargo los productos destacados, luego todos, y les asocio imágenes
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

    // Vista de apartar productos (referencia, no se usa directamente)
    mostrarApartado: (req, res) => {
        res.render('apartarProductos');
    },

    // Catálogo de productos
    // Solo muestra los activos, y filtra por categoría si el usuario eligió alguna
    mostrarCatalogo: (req, res) => {
        const categoriasSeleccionadas = normalizarCategorias(req.query.categoria || req.query.categorias);

        ProductoModel.obtenerTodos((error, productos) => {
            const listaProductosRaw = (error || !Array.isArray(productos)) ? [] : productos;

            // Solo productos activos en el catálogo público
            const productosActivos = listaProductosRaw.filter((producto) => producto.estado === 'activo');

            // Si eligió categorías, filtro; si no, muestro todos los activos
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

    // Panel principal de administración
    // Solo ven admin y aprendiz, si no tiene permisos lo mando al inicio
    mostrarMainAdmin: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }
        res.render('admin/mainAdmin', { usuario: usuarioSesion });
    },

    // Página para habilitar/deshabilitar productos y cambiar cantidades
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

    // Vista de "mis apartados" para el cliente
    // Muestra solo los apartados que él mismo creó
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
    },

    // Panel de pedidos del admin
    // Muestra todos los apartados pendientes para que los confirme o cancele
    mostrarPedidos: (req, res) => {
        const usuarioSesion = req.session?.usuario;
        const rol = usuarioSesion?.role ? String(usuarioSesion.role).trim().toLowerCase() : '';
        if (!usuarioSesion || (rol !== 'admin' && rol !== 'aprendiz')) {
            return res.redirect('/');
        }

        ProductoModel.obtenerTodosApartados((error, apartados) => {
            if (error) {
                console.error('Error al consultar apartados:', error);
                return res.status(500).send('Error en el servidor');
            }

            const listaApartados = Array.isArray(apartados) ? apartados : [];

            res.render('admin/pedidosAdmin', {
                usuario: usuarioSesion,
                apartados: listaApartados
            });
        });
    },
};


module.exports = ViewController;
