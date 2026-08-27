// =============================================
// ROUTER PRINCIPAL
// =============================================
// Agrupa los routers de cada área (público,
// clientes y admin) para montarlos de una vez.
// =============================================

const express = require('express');
const router = express.Router();

router.use(require('./publico'));
router.use(require('./cliente'));
router.use(require('./admin'));

module.exports = router;