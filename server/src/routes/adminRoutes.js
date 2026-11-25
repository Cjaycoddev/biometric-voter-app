const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getHierarchyOptions,
  getMetrics,
  searchVoters,
  getVoterDetails,
  getCountyStats,
  getConstituencyStats,
  getWardStats,
  getPollingStationStats,
  getVerificationLogs,
  exportVoters,
} = require('../controllers/adminController');

const adminAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
};

router.get('/hierarchy', adminAuth, getHierarchyOptions);
router.get('/metrics', adminAuth, getMetrics);
router.get('/voters', adminAuth, searchVoters);
router.get('/voters/export', adminAuth, exportVoters);
router.get('/voters/:id', adminAuth, getVoterDetails);
router.get('/stats/counties', adminAuth, getCountyStats);
router.get('/stats/constituencies', adminAuth, getConstituencyStats);
router.get('/stats/wards', adminAuth, getWardStats);
router.get('/stats/polling-stations', adminAuth, getPollingStationStats);
router.get('/verification-logs', adminAuth, getVerificationLogs);

module.exports = router;