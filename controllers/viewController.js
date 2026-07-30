const ProductoModel = require("../model/productoModel")

const ViewController = {
    // Renderiza la vista del Home
    mostrarLogin: (req, res) => {
        res.render('login');
    },

    // Renderiza la vista del catálogo
    mostrarMain: (req, res) => {
        ProductoModel.obtenerDestacados((error, productos) => {
            if (error) {
                return res.render("main", {
                    destacados: []
                });
            }
            res.render("main", {
                destacados: productos,
                usuario: req.session?.usuario || null
            });
        });
    },
    
    // Renderiza la vista de apartar productos
    mostrarApartado: (req, res) => {
        res.render('apartarProductos');
    },

    // Renderiza la vista de catálogo
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