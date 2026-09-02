// =============================================
// API DEL SITIO (IMÁGENES DEL CARRUSEL)
// =============================================
// Endpoint que devuelve las imágenes de la carpeta
// img/carrusel en JSON para el carousel de la
// página principal. Las lee dinámicamente.
// =============================================

const fs = require('fs');
const path = require('path');

const SitioApiController = {

    // GET /api/carrusel-imagenes
    // Lista las imágenes de la carpeta img/carrusel para el carousel
    // de la página principal (las lee dinámicamente, sin tocar código)
    carruselImagenes: (req, res) => {
        const carpetaCarrusel = path.join(__dirname, '..', '..', 'public', 'img', 'carrusel');
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
    }
};

module.exports = SitioApiController;
