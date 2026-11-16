// =============================================
// API DE CONFIGURACIÓN DE LA TIENDA
// =============================================
// Endpoints (solo Administrador) para leer y guardar
// la identidad del negocio y subir su logo.
//   - GET  /api/admin/tienda       → configuración actual
//   - PUT  /api/admin/tienda       → guarda campos validados
//   - POST /api/admin/tienda/logo  → logo en base64 (JPG/PNG/WebP)
//   - POST /api/admin/tienda/imagen → imagen de un bloque del inicio; devuelve su ruta
// =============================================

const fs = require('fs');
const path = require('path');
const tiendaService = require('../../services/tiendaService');
const auditoriaService = require('../../services/auditoriaService');
const { tipoRealImagen } = require('../../utils/imagenValida');

const CARPETA_MARCA = path.join(__dirname, '..', '..', 'public', 'img', 'marca');
const MAX_LOGO = 2 * 1024 * 1024;
const CARPETA_BLOQUES = path.join(__dirname, '..', '..', 'public', 'img', 'upload', 'tienda');
const MAX_IMAGEN_BLOQUE = 3 * 1024 * 1024;

// dataURL base64 -> { bytes, ext } o { mensaje } si no es una imagen JPG/PNG/WebP real o pesa más de max
function leerImagen(dataUrl, max, nombre) {
    const coincidencia = String(dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,/i);
    if (!coincidencia) return { mensaje: 'Imagen inválida. Debe ser JPG, PNG o WebP.' };
    const ext = coincidencia[1].toLowerCase() === 'jpeg' ? 'jpg' : coincidencia[1].toLowerCase();
    const bytes = Buffer.from(String(dataUrl).split(',')[1] || '', 'base64');
    if (bytes.length > max) return { mensaje: `${nombre} es demasiado pesad${nombre.startsWith('La') ? 'a' : 'o'} (máximo ${max / 1024 / 1024} MB).` };
    if (tipoRealImagen(bytes) !== ext) return { mensaje: 'El archivo no es una imagen JPG, PNG o WebP válida.' };
    return { bytes, ext };
}

const TiendaApiController = {

    obtener: (req, res) => res.json({ ok: true, tienda: tiendaService.obtener() }),

    guardar: async (req, res) => {
        const { error, datos } = tiendaService.validarConfiguracion(req.body || {});
        if (error) {
            return res.status(400).json({ ok: false, mensaje: error });
        }
        try {
            const tienda = await tiendaService.guardar(datos);
            auditoriaService.registrar(req, 'tienda_configurar', `Actualizó la configuración de la tienda (${Object.keys(datos).join(', ')}).`);
            return res.json({ ok: true, mensaje: 'Configuración guardada.', tienda });
        } catch (err) {
            console.error('Error guardando configuración de la tienda:', err);
            return res.status(500).json({ ok: false, mensaje: 'No se pudo guardar la configuración.' });
        }
    },

    subirLogo: async (req, res) => {
        const { bytes, ext: declarado, mensaje } = leerImagen(req.body?.imagen, MAX_LOGO, 'El logo');
        if (mensaje) return res.status(400).json({ ok: false, mensaje });
        try {
            await fs.promises.mkdir(CARPETA_MARCA, { recursive: true });
            // Nombre con marca de tiempo: evita que el navegador muestre el logo viejo en caché
            const nombreArchivo = `logo-${Date.now()}.${declarado}`;
            await fs.promises.writeFile(path.join(CARPETA_MARCA, nombreArchivo), bytes);
            const anterior = tiendaService.obtener().logo_url;
            const tienda = await tiendaService.guardar({ logo_url: `/img/marca/${nombreArchivo}` });
            // Borro el logo anterior solo si vivía en la carpeta de marca
            if (anterior && /^\/img\/marca\/logo-\d+\.(jpg|png|webp)$/.test(anterior)) {
                fs.promises.unlink(path.join(CARPETA_MARCA, path.basename(anterior))).catch(() => {});
            }
            auditoriaService.registrar(req, 'tienda_logo', `Cambió el logo de la tienda (${nombreArchivo}).`);
            return res.json({ ok: true, mensaje: 'Logo actualizado.', tienda });
        } catch (err) {
            console.error('Error subiendo logo de la tienda:', err);
            return res.status(500).json({ ok: false, mensaje: 'No se pudo guardar el logo.' });
        }
    },

    // Solo guarda el archivo; la ruta queda en la configuración cuando se guardan los bloques.
    // shortcut: las imágenes que se dejan de usar quedan en disco; limpiar si la carpeta crece mucho.
    subirImagenBloque: async (req, res) => {
        const { bytes, ext, mensaje } = leerImagen(req.body?.imagen, MAX_IMAGEN_BLOQUE, 'La imagen');
        if (mensaje) return res.status(400).json({ ok: false, mensaje });
        try {
            await fs.promises.mkdir(CARPETA_BLOQUES, { recursive: true });
            const nombreArchivo = `bloque-${Date.now()}.${ext}`;
            await fs.promises.writeFile(path.join(CARPETA_BLOQUES, nombreArchivo), bytes);
            auditoriaService.registrar(req, 'tienda_imagen', `Subió una imagen para el inicio (${nombreArchivo}).`);
            return res.json({ ok: true, ruta: `/img/upload/tienda/${nombreArchivo}` });
        } catch (err) {
            console.error('Error subiendo imagen de bloque:', err);
            return res.status(500).json({ ok: false, mensaje: 'No se pudo guardar la imagen.' });
        }
    }
};

module.exports = TiendaApiController;
