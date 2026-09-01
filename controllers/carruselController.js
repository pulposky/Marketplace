// =============================================
// CONTROLADOR DE CARRUSEL (panel admin)
// =============================================
// Permite gestionar las imágenes del carrusel de la
// portada: subir nuevas, eliminarlas y reordenarlas.
// Las imágenes viven en public/img/carrusel y se
// muestran en la portada en orden de numeración.
// =============================================

const fs = require('fs');
const path = require('path');

const CARPETA_CARRUSEL = path.join(__dirname, '..', 'public', 'img', 'carrusel');

// Devuelve el prefijo numérico de un archivo del carrusel (o 0 si no tiene)
const prefijoDeArchivo = (nombre) => {
    const coincidencia = String(nombre).match(/^(\d{3})-.*/i);
    return coincidencia ? parseInt(coincidencia[1], 10) : 0;
};

// Devuelve el nombre libre de la extensión sin el prefijo numérico
const nombreLimpio = (nombre) => {
    return String(nombre).replace(/^(\d{3})-/, '');
};

// Lee la carpeta y devuelve la lista ordenada de imágenes existentes
const listarImagenes = () => {
    return new Promise((resuelta, rechazada) => {
        fs.readdir(CARPETA_CARRUSEL, (error, archivos) => {
            if (error) {
                return rechazada(error);
            }

            const imagenes = (archivos || [])
                .filter((archivo) => /\.(jpg|jpeg|png|webp)$/i.test(archivo))
                .map((nombre) => ({
                    nombre,
                    prefijo: prefijoDeArchivo(nombre),
                    label: nombreLimpio(nombre).replace(/\.(jpg|jpeg|png|webp)$/i, ''),
                    url: `/img/carrusel/${nombre}`
                }))
                .sort((a, b) => a.prefijo - b.prefijo || a.nombre.localeCompare(b.nombre));

            resuelta(imagenes);
        });
    });
};

// Página: GET /admin/carrusel
const mostrarGestionCarrusel = async (req, res) => {
    try {
        let imagenes = [];
        try {
            imagenes = await listarImagenes();
        } catch (error) {
            console.error('Error listando carrusel:', error);
        }

        res.render('admin/carruselAdmin', {
            imagenes,
            usuario: req.session.usuario
        });
    } catch (error) {
        console.error('Error mostrando gestión de carrusel:', error);
        return res.status(500).render('error', { codigo: 500, mensaje: 'Error en el servidor.' });
    }
};

// POST /api/admin/carrusel/subir
// Recibe un dataURL base64, lo valida y lo guarda en la
// carpeta img/carrusel con un prefijo numérico que indica el orden.
const subirImagen = async (req, res) => {
    const { imagen } = req.body || {};

    const coincidencia = String(imagen || '').match(/^data:image\/(jpeg|png|webp);base64,/i);
    if (!coincidencia) {
        return res.status(400).json({ error: 'Imagen inválida. Debe ser JPG, PNG o WebP.' });
    }

    const extension = coincidencia[1].toLowerCase() === 'jpeg' ? 'jpg' : coincidencia[1].toLowerCase();
    const base64 = String(imagen).split(',')[1];
    const bytes = Buffer.from(base64, 'base64');

    // Limito el peso de la imagen (máximo 3 MB)
    if (bytes.length > 3 * 1024 * 1024) {
        return res.status(400).json({ error: 'La imagen es demasiado pesada (máximo 3 MB).' });
    }

    try {
        const imagenes = await listarImagenes();
        const maxPrefijo = imagenes.reduce((max, imagenAct) => Math.max(max, imagenAct.prefijo), 0);
        const nuevoPrefijo = String(maxPrefijo + 1).padStart(3, '0');

        // Nombre seguro: solo letras, números, guiones y guiones bajos
        const nombreOriginal = String(imagenes.length ? (imagen.match(/[^/]+$/)?.[0] || '') : '');
        const baseSegura = (req.body.nombre || 'diapositiva')
            .replace(/[^a-z0-9_-]/gi, '')
            .slice(0, 40);

        const nombreArchivo = `${nuevoPrefijo}-${baseSegura || 'diapositiva'}.${extension}`;
        const rutaArchivo = path.join(CARPETA_CARRUSEL, nombreArchivo);

        fs.writeFile(rutaArchivo, bytes, (errorFs) => {
            if (errorFs) {
                console.error('Error escribiendo imagen de carrusel:', errorFs);
                return res.status(500).json({ error: 'Error en el servidor al guardar la imagen.' });
            }

            return res.json({
                ok: true,
                mensaje: 'Imagen agregada al carrusel correctamente.',
                imagen: {
                    nombre: nombreArchivo,
                    url: `/img/carrusel/${nombreArchivo}`
                }
            });
        });
    } catch (error) {
        console.error('Error subiendo imagen de carrusel:', error);
        return res.status(500).json({ error: 'Error en el servidor.' });
    }
};

// POST /api/admin/carrusel/eliminar
// Elimina una imagen de la carpeta del carrusel.
const eliminarImagen = async (req, res) => {
    const nombre = String((req.body && req.body.imagen) || '').trim();

    // Solo se permite el nombre del archivo (bloqueo de rutas tipo ../)
    if (!nombre || path.basename(nombre) !== nombre) {
        return res.status(400).json({ error: 'Nombre de imagen inválido.' });
    }

    try {
        const imagenes = await listarImagenes();
        const existe = imagenes.some((item) => item.nombre === nombre);

        if (!existe) {
            return res.status(404).json({ error: 'La imagen no existe en el carrusel.' });
        }

        fs.unlink(path.join(CARPETA_CARRUSEL, nombre), (errorFs) => {
            if (errorFs) {
                console.error('Error eliminando imagen de carrusel:', errorFs);
                return res.status(500).json({ error: 'Error en el servidor al eliminar la imagen.' });
            }

            return res.json({ ok: true, mensaje: 'Imagen eliminada del carrusel.' });
        });
    } catch (error) {
        console.error('Error eliminando imagen de carrusel:', error);
        return res.status(500).json({ error: 'Error en el servidor.' });
    }
};

module.exports = {
    mostrarGestionCarrusel,
    subirImagen,
    eliminarImagen
};