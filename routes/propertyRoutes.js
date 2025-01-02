
const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Property routes
router.get('/properties', propertyController.getAllProperties);
router.get('/properties/:id', propertyController.getPropertyById);
router.post('/properties', propertyController.createProperty);
router.put('/properties/:id', propertyController.updateProperty);
router.delete('/properties/:id', propertyController.deleteProperty);
router.get('/tags', propertyController.getAllTags);

module.exports = router;