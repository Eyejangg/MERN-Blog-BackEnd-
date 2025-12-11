const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv");
const secret = process.env.SECRET;

// เช็ค Username , password ว่ามีไหม
exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send({
      message: "Please provide username and password",
    });
  }
  const existingUser = await UserModel.findOne({ username });
  if (existingUser) {
    return res.status(400).send({
      message: "This username is already existed",
    });
  }

  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const user = await UserModel.create({ username, password: hashedPassword });
    res.status(201).send({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).send({
        message: error.message || "Some Errors occured while registering a new user"
    });
   
};

exports.login = async (req, res) => {};
