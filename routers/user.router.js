const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const cors = require("cors");

//http://localhost:5000/api/v1/user/register
router.post("/register", userController.register);

//http://localhost:5000/api/v1/user/register
router.post("/login", userController.login);

module.exports = router;
