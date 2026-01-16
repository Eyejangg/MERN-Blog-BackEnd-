const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const authJwt = require("../middlewares/authJWT.middleware");
const { upload, uploadToSupabase } = require("../middlewares/file.middleware");

//http://localhost:5000/api/v1/post
router.post(
  "",
  authJwt.verifyToken,
  upload,
  uploadToSupabase,
  postController.createPost
);

//http://localhost:5000/api/v1/post
router.get("", postController.getPosts);

//http://localhost:5000/api/v1/post/1
router.get("/:id", postController.getById);

//http://localhost:5000/api/v1/post/author/1
router.get("/author/:id", postController.getByAuthorId);

//http://localhost:5000/api/v1/post/1
router.put("/:id", authJwt.verifyToken, postController.upDatePost);

//http://localhost:5000/api/v1/post/1
router.delete("/:id", authJwt.verifyToken, postController.deletePost);
module.exports = router;
