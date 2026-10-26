'use strict';
const express = require('express');
const auth = require('../services/auth');
const { requireAuth } = require('../middleware/auth');
const { createLoginLimiter } = require('../middleware/security');
const { listBusinessTypes } = require('../seed/templates');

const router = express.Router();
const limiter = createLoginLimiter();

router.get('/business-types', (_req, res) => res.json({ items: listBusinessTypes() }));
router.post('/register', (req, res) => res.status(201).json(auth.register(req.body || {})));
router.post('/login', (req, res) => res.json(auth.login(req.body || {}, limiter, req)));
router.get('/me', requireAuth, (req, res) => res.json(auth.me(req.user.id)));
router.patch('/me', requireAuth, (req, res) => res.json(auth.updateProfile(req.user.id, req.body || {})));
router.patch('/business', requireAuth, (req, res) => res.json({ business: auth.updateBusiness(req.user.businessId, req.body || {}) }));

module.exports = router;
