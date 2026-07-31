const express = require('express');
const router = express.Router();

const ViewController = require('../controllers/viewController');
const ProductoController = require('../controllers/productosController');
const UsuarioController = require('../controllers/usuarioController');
const protegerRuta = require('../middleware/verificarUsuario');

// Vista Login
router.post('/login', UsuarioController.loginUsuarioController);
router.get('/logout', UsuarioController.logoutUsuarioController);

// Vista principal
router.get('/', ViewController.mostrarMain);

// Catálogo de productos
router.get('/catalogo', ViewController.mostrarCatalogo);


// Rutas verificar sesión
router.get("/api/verificar-sesion", (req, res) => {
    if(req.session && req.session.usuario){
        return res.json({
            login:true
        });
    }
    res.json({
        login:false
    });
});

module.exports = router;