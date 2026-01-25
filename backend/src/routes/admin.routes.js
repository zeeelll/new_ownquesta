// Admin routes

const router = require("express").Router();
const requireAuth = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/admin.middleware");
const adminController = require("../controllers/admin.controller");
const authController = require("../controllers/auth.controller");

router.use(requireAuth); // All admin routes require authentication
router.use(requireAdmin); // All admin routes require admin role

router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);
router.put("/users/:id/make-admin", adminController.makeAdmin);
router.put("/users/:id/remove-admin", adminController.removeAdmin);
router.get("/users/:id/activities", adminController.getUserActivities);

// Activity routes
router.get("/activities", adminController.getAllActivities);

// Admin registration endpoint
router.post("/register-admin", authController.registerAdmin);

module.exports = router;