const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const cors = require("cors");

//http://localhost:5000/api/v1/post/create
router.post("/create", postController.createPost);
//http://localhost:5000/api/v1/post/1
router.get("/:id", postController.getById);
//http://localhost:5000/api/v1/post/
router.get("", postController.getAll);
//http://localhost:5000/api/v1/post/author/:id
router.get("/author/:id", postController.getByAuthorId);
//http://localhost:5000/api/v1/post/:id
router.put("/:id", postController.updateById);
//http://localhost:5000/api/v1/post/:id
router.delete("/:id", postController.deleteById);

module.exports = router;
