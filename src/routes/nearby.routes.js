const router = require("express").Router();
const nearbyController = require("../controllers/nearby.controller");

router.get("/all", nearbyController.getAllNearby);
router.get("/", nearbyController.getNearbyByType);


module.exports = router;