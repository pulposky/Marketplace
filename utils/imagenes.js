// =============================================
// UTILIDAD: IMÁGENES DE PRODUCTOS
// =============================================
// Une cada producto con su foto en la carpeta
// /img/upload comparando los nombres normalizados.
// =============================================

const fs = require('fs');
const path = require('path');

// Quita tildes, caracteres especiales y convierte a minúsculas.
// Se usa para comparar nombres de producto con nombres de archivo de imagen.
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
// con el nombre de cada producto y las adjunta al objeto producto.
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

module.exports = { asociarImagenesAProductos, normalizeText };