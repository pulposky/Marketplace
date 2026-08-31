// =============================================
// MIDDLEWARE: VALIDACIÓN Y SANEAMIENTO DE INPUTS
// =============================================
// Usa express-validator para validar y limpiar
// los datos que llegan del frontend (login,
// registro y formularios). Evita datos corruptos
// y reduce el riesgo de inyección.
// =============================================

const { body, validationResult } = require('express-validator');

// Reglas de validación para el LOGIN.
// El login es especial: acepta "usuario+password"
// (admin/aprendiz) o solo "documento" (clientes).
const validarLogin = [
  // El body puede traer documento y/o usuario
  body('usuario')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('Usuario demasiado largo')
    .escape(),
  body('documento')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Documento demasiado largo')
    .matches(/^[a-zA-Z0-9-]+$/).withMessage('Documento con caracteres inválidos'),
  body('password').optional().isLength({ max: 100 }),
  body('nuevaPassword').optional().isLength({ max: 100 }),

  // Devuelve el error en el mismo formato que usa el frontend
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.json({ ok: false, tipo: 'vacio', mensaje: errores.array()[0].msg });
    }
    next();
  }
];

// Reglas de validación para el REGISTRO de clientes
const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Nombre demasiado largo')
    .escape(),
  body('documento')
    .trim()
    .notEmpty().withMessage('El documento es obligatorio')
    .isLength({ max: 20 }).withMessage('Documento demasiado largo')
    .matches(/^[a-zA-Z0-9-]+$/).withMessage('Documento con caracteres inválidos'),
  body('direccion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Dirección demasiado larga')
    .escape(),
  body('telefono')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('Teléfono demasiado largo')
    .isNumeric().withMessage('Teléfono inválido'),
  body('rol')
    .trim()
    .notEmpty().withMessage('El rol es obligatorio')
    .isIn(['aprendiz', 'instructor', 'contratista', 'externo', 'administrativo'])
    .withMessage('Rol no válido'),
  body('password')
    .if(body('nuevaPassword').not().exists())
    .optional({ checkFalsy: true })
    .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nuevaPassword')
    .optional({ checkFalsy: true })
    .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener al menos 6 caracteres'),

  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.json({ ok: false, mensaje: errores.array()[0].msg });
    }
    next();
  }
];

module.exports = { validarLogin, validarRegistro };
