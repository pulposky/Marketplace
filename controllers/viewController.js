const ViewController = {
    // Renderiza la vista del Home
    mostrarHome: (req, res) => {
        res.render('home');
    },

    // Renderiza la vista del catálogo
    mostrarCatalogo: (req, res) => {
        res.render('productos');
    },
    
};

module.exports = ViewController;