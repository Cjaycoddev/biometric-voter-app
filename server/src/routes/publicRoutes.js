const express = require('express');
const router = express.Router();
const {
  getCounties,
  getConstituencies,
  getWards,
  getPollingStations,
  validateIdNumber,
  validatePhone,
} = require('../controllers/publicController');

router.get('/counties', getCounties);
router.get('/constituencies', getConstituencies);
router.get('/wards', getWards);
router.get('/polling-stations', getPollingStations);
router.get('/validate-id', validateIdNumber);
router.get('/validate-phone', validatePhone);

module.exports = router;