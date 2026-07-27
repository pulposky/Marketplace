const express = require('express');
const router = express.Router();

// Ruta de la página de inicio
router.get('/', (req, res) => {
    res.render('index');
});

module.exports = router;