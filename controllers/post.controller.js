const PostModel = require("../models/Post");

//========== Function: สร้าง Blog Post ใหม่ ==========
// ฟังก์ชันนี้รับข้อมูล title, summary, content และไฟล์รูปภาพ
// แล้วบันทึกลงฐานข้อมูล MongoDB
exports.createPost = async (req, res) => {
  // ตรวจสอบว่ามีไฟล์รูปภาพหรือไม่
  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }

  // ตรวจสอบว่า Supabase อัพโหลดไฟล์สำเร็จและได้ URL กลับมาหรือไม่
  if (!req.file.supabaseUrl) {
    return res.status(400).json({
      message: "Failed to upload image. Please try again",
    });
  }

  // ดึงข้อมูล title, summary, content จาก request body
  const { title, summary, content } = req.body;
  // ดึง ID ของผู้สร้าง post จาก JWT token (เก็บไว้ใน authJWT middleware)
  const authorId = req.authorId;

  // ตรวจสอบว่ามีข้อมูลทั้งหมดหรือไม่
  if (!title || !summary || !content) {
    return res.status(400).send({
      message: "Please provide all fields",
    });
  }

  try {
    // สร้าง document ใหม่ในฐานข้อมูล MongoDB
    const postDoc = await PostModel.create({
      title,
      summary,
      content,
      cover: req.file.supabaseUrl, // บันทึก URL รูปภาพจาก Supabase
      author: authorId, // บันทึก ID ของผู้สร้าง
    });

    // ถ้าการสร้าง document ล้มเหลว ส่ง error
    if (!postDoc) {
      return res.status(500).send({
        message: "Cannot create a new post",
      });
    }

    // ส่ง response สำเร็จพร้อมข้อมูล post ที่สร้างขึ้น
    res.send({ message: "Create a new post successfully", data: postDoc });
  } catch (error) {
    // จัดการ error ที่เกิดขึ้น
    res.status(500).send({
      message:
        error.message || "Some errors occurred while registering a new user",
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20);
    if (!posts) {
      return res.status(404).send({
        message: "Post not found",
      });
    }
    res.send(posts);
  } catch (error) {
    res.status(500).send({
      message:
        error.message || "Some errors occurred while registering a new user",
    });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).send({
      message: "Post Id is missing",
    });
  }
  try {
    const post = await PostModel.findById(id).populate("author", ["username"]);
    // .sort({ createdAt: -1 })
    // .limit(20);
    if (!post) {
      return res.status(404).send({
        message: "Post not found",
      });
    }
    res.send(post);
  } catch (error) {
    res.status(500).send({
      message:
        error.message || "Some errors occurred while registering a new user",
    });
  }
};

exports.getByAuthorId = async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).send({
      message: "Author id is missing",
    });
  }
  try {
    const posts = await PostModel.find({ author: id })
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(20);
    if (!posts) {
      return res.status(404).send({
        message: "Post not found",
      });
    }
    res.send(posts);
  } catch (error) {
    res.status(500).send({
      message:
        error.message || "Some errors occurred while registering a new user",
    });
  }
};

exports.upDatePost = async (req, res) => {
  const { id } = req.params;
  const authorId = req.authorId;
  if (!id) {
    return res.status(400).send({
      message: "Post Id is missing",
    });
  }
  const { title, summary, content, cover } = req.body;
  if (!title || !summary || !content || !cover) {
    return res.status(400).send({
      message: "Please provide all fields",
    });
  }
  try {
    const postDoc = await PostModel.findOne({ _id: id, author: authorId });

    if (!postDoc) {
      return res.status(404).send({ message: "Post not found" });
    }
    if (postDoc.length === 0) {
      return res.status(403).send({
        message:
          "Unauthorize to edit this post, because you are not the author of this post",
      });
    } else {
      // postDoc.title = title;
      // postDoc.summary = summary;
      // postDoc.content = content;
      // postDoc.cover = cover;
      // await postDoc.save();
      const newPost = await PostModel.findOneAndUpdate(
        { author: authorId, _id: id },
        { title, summary, content, cover },
        {
          new: true,
        }
      );
      if (!newPost) {
        return res.status(500).send({ message: "Cannot update this post" });
      }
      res.send({ message: "Post updated successfully" });
    }
  } catch (error) {
    return res.status(500).send({
      message:
        error.message || "Some errors occurred while registering a new user",
    });
  }
};

exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const authorId = req.authorId;

  if (!id) {
    return res.status(400).send({
      message: "Post Id is missing",
    });
  }
  try {
    const postDoc = await PostModel.findOneAndDelete({
      author: authorId,
      _id: id,
    });
    if (!postDoc) {
      return res.status(500).send({ message: "Cannot delete this post" });
    }
    res.send({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).send({
      message:
        error.message || "Some errors occurred while registering a new user",
    });
  }
};
