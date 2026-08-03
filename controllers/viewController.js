// Controlador de vistas principales del marketplace
const ProductoModel = require("../model/productoModel")

const ViewController = {
    // Muestra el formulario de login
    mostrarLogin: (req, res) => {
        res.render('login');
    },

    // Muestra la página principal con destacados y listado de productos
    mostrarMain: (req, res) => {
        ProductoModel.obtenerDestacados((error, destacados) => {
            const listaDestacados = error ? [] : destacados;

            ProductoModel.obtenerTodos((errorTodos, todosLosProductos) => {
                const listaProductos = errorTodos ? [] : todosLosProductos;

                res.render("main", {
                    destacados: listaDestacados,
                    productos: listaProductos,
                    usuario: req.session?.usuario || null
                });
            });
        });
    },

    // Renderiza la vista para apartar productos (si se usa)
    mostrarApartado: (req, res) => {
        res.render('apartarProductos');
    },

    // Renderiza la página de catálogo con todos los productos
    mostrarCatalogo: (req, res) => {
        ProductoModel.obtenerTodos((error, productos) => {
            if (error) {
                return res.render("productos", {
                    productos: [],
                });
            }
            res.render("productos", {
                productos
            });
        });
    }
};

module.exports = ViewController;