'use strict';
const express = require('express');
const auth = require('../services/auth');
const { requireAuth } = require('../middleware/auth');
const { createLoginLimiter } = require('../middleware/security');
const { listBusinessTypes } = require('../seed/templates');

const router = express.Router();
const limiter = createLoginLimiter();

router.get('/business-types', (_req, res) => res.json({ items: listBusinessTypes() }));
router.post('/register', async (req, res) => res.status(201).json(await auth.register(req.body || {})));
router.post('/login', async (req, res) => res.json(await auth.login(req.body || {}, limiter, req)));
router.get('/me', requireAuth, async (req, res) => res.json(await auth.me(req.user.id)));
router.patch('/me', requireAuth, async (req, res) => res.json(await auth.updateProfile(req.user.id, req.body || {})));
router.delete('/business/data', requireAuth, async (req, res) => res.json(await auth.clearBusinessData(req.user.businessId)));
router.patch('/business', requireAuth, async (req, res) => res.json({ business: await auth.updateBusiness(req.user.businessId, req.body || {}) }));

module.exports = router;
