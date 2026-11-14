// =============================================
// API DE CONFIGURACIÓN DE LA TIENDA
// =============================================
// Endpoints (solo Administrador) para leer y guardar
// la identidad del negocio y subir su logo.
//   - GET  /api/admin/tienda       → configuración actual
//   - PUT  /api/admin/tienda       → guarda campos validados
//   - POST /api/admin/tienda/logo  → logo en base64 (JPG/PNG/WebP)
// =============================================

const fs = require('fs');
const path = require('path');
const tiendaService = require('../../services/tiendaService');
const auditoriaService = require('../../services/auditoriaService');
const { tipoRealImagen } = require('../../utils/imagenValida');

const CARPETA_MARCA = path.join(__dirname, '..', '..', 'public', 'img', 'marca');
const MAX_LOGO = 2 * 1024 * 1024;

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
        const coincidencia = String(req.body?.imagen || '').match(/^data:image\/(jpeg|png|webp);base64,/i);
        if (!coincidencia) {
            return res.status(400).json({ ok: false, mensaje: 'Imagen inválida. Debe ser JPG, PNG o WebP.' });
        }
        const declarado = coincidencia[1].toLowerCase() === 'jpeg' ? 'jpg' : coincidencia[1].toLowerCase();
        const bytes = Buffer.from(String(req.body.imagen).split(',')[1] || '', 'base64');
        if (bytes.length > MAX_LOGO) {
            return res.status(400).json({ ok: false, mensaje: 'El logo es demasiado pesado (máximo 2 MB).' });
        }
        if (tipoRealImagen(bytes) !== declarado) {
            return res.status(400).json({ ok: false, mensaje: 'El archivo no es una imagen JPG, PNG o WebP válida.' });
        }
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
    }
};

module.exports = TiendaApiController;
