const ViewController = {
    // Renderiza la vista del Home
    mostrarLogin: (req, res) => {
        res.render('login');
    },

    // Renderiza la vista del catálogo
    mostrarCatalogo: (req, res) => {
        res.render('productos');
    },
    
};

module.exports = ViewController;