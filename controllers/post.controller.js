const PostModel = require("../models/Post");

exports.createPost = async (req, res) => {
  const { title, summary, content, cover, author } = req.body;
  if (!title || !summary || !content || !cover || !author) {
    return res.status(400).send({
      message:
        "Please Provide title, summary, content, cover image and author !",
    });
  }
  try {
    const postDoc = await PostModel.create({
      title,
      summary,
      content,
      cover,
      author,
    });
    if (!postDoc) {
      return res.status(500).send({
        message: "Cannot create post!",
      });
    }
    res.status(201).send({
      message: "Post created successfully!",
      data: postDoc,
    });
  } catch (error) {
    res.status(500).send({
      message:
        error.message || "Some errors occured while creating a new post!",
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20);
    if (!posts) {
      return res.status(404).send({
        message: "Posts Not found!",
      });
    }
    return res.status(200).send(posts);
  } catch (error) {
    return res.status(500).send({
      message: error.message || "Some error occurred while Geting all posts.",
    });
  }
};

exports.getById = async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).send({
      message: "Post ID is missing!",
    });
  }
  try {
    const post = await PostModel.findById(id).populate("author", ["username"]);
    if (!post) {
      return res.status(404).send({
        message: "Post Not found!",
      });
    }
    return res.status(200).send(post);
  } catch (error) {
    return res.status(500).send({
      message: error.message || "Some error occurred while Geting the post.",
    });
  }
};

exports.getByAuthorId = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).send({
      message: "Author ID is missing!",
    });
  }
  try {
    const posts = await PostModel.find({ author: id })
      .populate("author", ["username"])
      .sort({ createdAt: -1 });
    if (!posts) {
      return res.status(404).send({
        message: "Posts Not found!",
      });
    }
    return res.status(200).send(posts);
  } catch (error) {
    return res.status(500).send({
      message:
        error.message || "Some error occurred while Geting posts by author.",
    });
  }
};

exports.updateById = async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).send({
      message: "ID is missing!",
    });
  }
  try {
    const updatedPost = await PostModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedPost) {
      return res.status(404).send({
        message: "Post Not found!",
      });
    }
    return res.status(200).send({
      message: "Post updated successfully!",
      data: updatedPost,
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message || "Some error occurred while updating the post.",
    });
  }
};

exports.deleteById = async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).send({
      message: "ID is missing!",
    });
  }
  try {
    const deletedPost = await PostModel.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).send({
        message: "Post Not found!",
      });
    }
    return res.status(200).send({
      message: "Post deleted successfully!",
    });
  } catch (error) {
    return res.status(500).send({
      message: error.message || "Some error occurred while deleting the post.",
    });
  }
};
