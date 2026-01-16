const PostModel = require("../models/Post");

//========== ฟังก์ชัน: สร้าง Blog Post ใหม่ (บรรทัดที่ 1-49) ==========
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

//========== ฟังก์ชัน: ดึง Blog Posts ทั้งหมด (บรรทัดที่ 51-77) ==========
// ฟังก์ชันนี้ดึง posts ล่าสุด 20 รายการมาแสดง
// ข้อมูลประกอบด้วย title, summary, cover, author, createdAt เป็นต้น
exports.getPosts = async (req, res) => {
  try {
    // ค้นหา posts โดยจัดเรียงตามวันที่สร้างล่าสุดก่อน และ limit 20 รายการ
    const posts = await PostModel.find()
      .populate("author", ["username"]) // เติมข้อมูล author (เฉพาะ username)
      .sort({ createdAt: -1 }) // จัดเรียงจากใหม่ที่สุดก่อน
      .limit(20); // จำกัดเพียง 20 รายการ

    // ถ้าไม่พบ posts ให้ส่ง error
    if (!posts || posts.length === 0) {
      return res.status(404).send({
        message: "No posts found",
      });
    }

    // ✅ Filter ออก posts ที่ author เป็น null (ป้องกัน error ใน Frontend)
    const validPosts = posts.filter((post) => post.author !== null);

    // ถ้าไม่มี posts ที่ valid
    if (validPosts.length === 0) {
      return res.status(404).send({
        message: "No valid posts found",
      });
    }

    // ส่ง response สำเร็จพร้อมรายการ posts
    res.send(validPosts);
  } catch (error) {
    // จัดการ error ที่เกิดขึ้น
    res.status(500).send({
      message: error.message || "Some errors occurred while fetching posts",
    });
  }
};

//========== ฟังก์ชัน: ดึง Blog Post เดียวตาม ID (บรรทัดที่ 79-107) ==========
// ฟังก์ชันนี้ดึง post เดียวจาก ID ที่ระบุ
exports.getById = async (req, res) => {
  // ดึง post ID จาก URL parameter
  const { id } = req.params;

  // ตรวจสอบว่า post ID มีค่าหรือไม่
  if (!id) {
    return res.status(400).send({
      message: "Post Id is missing",
    });
  }

  try {
    // ค้นหา post ตาม ID และเติมข้อมูล author
    const post = await PostModel.findById(id).populate("author", ["username"]);

    // ถ้าไม่พบ post
    if (!post) {
      return res.status(404).send({
        message: "Post not found",
      });
    }

    // ✅ ตรวจสอบว่า author มีค่าหรือไม่ (ป้องกัน error ใน Frontend)
    if (!post.author) {
      return res.status(404).send({
        message: "Post author not found",
      });
    }

    // ส่ง response สำเร็จพร้อมข้อมูล post
    res.send(post);
  } catch (error) {
    // จัดการ error ที่เกิดขึ้น
    res.status(500).send({
      message: error.message || "Some errors occurred while fetching the post",
    });
  }
};

//========== ฟังก์ชัน: ดึง Blog Posts ตาม Author ID (บรรทัดที่ 109-143) ==========
// ฟังก์ชันนี้ดึง posts ทั้งหมดของ author ที่ระบุ
// จัดเรียงจากล่าสุดก่อน และ limit 20 รายการ
exports.getByAuthorId = async (req, res) => {
  // ดึง author ID จาก URL parameter
  const { id } = req.params;

  // ตรวจสอบว่า author ID มีค่าหรือไม่
  if (!id) {
    return res.status(400).send({
      message: "Author id is missing",
    });
  }

  try {
    // ค้นหา posts โดย author ID และจัดเรียงตามวันที่สร้างล่าสุดก่อน
    const posts = await PostModel.find({ author: id })
      .populate("author", ["username"]) // เติมข้อมูล author (เฉพาะ username)
      .sort({ createdAt: -1 }) // จัดเรียงจากใหม่ที่สุดก่อน
      .limit(20); // จำกัดเพียง 20 รายการ

    // ถ้าไม่พบ posts
    if (!posts || posts.length === 0) {
      return res.status(404).send({
        message: "No posts found for this author",
      });
    }

    // ✅ Filter ออก posts ที่ author เป็น null (ป้องกัน error ใน Frontend)
    const validPosts = posts.filter((post) => post.author !== null);

    // ถ้าไม่มี posts ที่ valid
    if (validPosts.length === 0) {
      return res.status(404).send({
        message: "No valid posts found for this author",
      });
    }

    // ส่ง response สำเร็จพร้อมรายการ posts
    res.send(validPosts);
  } catch (error) {
    // จัดการ error ที่เกิดขึ้น
    res.status(500).send({
      message:
        error.message || "Some errors occurred while fetching author posts",
    });
  }
};

//========== ฟังก์ชัน: อัปเดต Blog Post (บรรทัดที่ 145-215) ==========
// ฟังก์ชันนี้อัปเดตข้อมูล post (title, summary, content, cover)
// เฉพาะผู้เขียน (author) เท่านั้นที่สามารถแก้ไขได้
exports.upDatePost = async (req, res) => {
  // ดึง post ID จาก URL parameter
  const { id } = req.params;
  // ดึง author ID จาก JWT token
  const authorId = req.authorId;

  // ตรวจสอบว่า post ID มีค่าหรือไม่
  if (!id) {
    return res.status(400).send({
      message: "Post Id is missing",
    });
  }

  try {
    // ค้นหา post ก่อน เพื่อได้ข้อมูล cover เก่า
    const postDoc = await PostModel.findOne({ _id: id, author: authorId });

    // ถ้าไม่พบ post หรือไม่ใช่เจ้าของ
    if (!postDoc) {
      return res.status(403).send({
        message:
          "Unauthorized: You are not the author of this post or post not found",
      });
    }

    // ดึงข้อมูล title, summary, content จาก request body
    const { title, summary, content } = req.body;

    // ตรวจสอบว่ามี title, summary, content หรือไม่ (cover optional)
    if (!title || !summary || !content) {
      return res.status(400).send({
        message: "Please provide title, summary, and content",
      });
    }

    // ถ้ามีไฟล์ใหม่อัพโหลด ให้ใช้ URL ใหม่ มิฉะนั้นให้ใช้ cover เก่า
    let cover = postDoc.cover; // ใช้ cover เก่าเป็น default
    if (req.file && req.file.supabaseUrl) {
      cover = req.file.supabaseUrl;
    } else if (req.body.cover) {
      // ถ้ามี cover ในการร้องขอ (อัพโหลดผ่าน frontend)
      cover = req.body.cover;
    }

    // อัปเดต post ด้วยข้อมูลใหม่
    const updatedPost = await PostModel.findOneAndUpdate(
      { _id: id, author: authorId },
      { title, summary, content, cover },
      { new: true } // คืนค่า document ที่อัปเดตแล้ว
    );

    // ถ้าการอัปเดตล้มเหลว
    if (!updatedPost) {
      return res.status(500).send({
        message: "Cannot update this post",
      });
    }

    // ส่ง response สำเร็จพร้อมข้อมูล post ที่อัปเดตแล้ว
    res.send({
      message: "Post updated successfully",
      data: updatedPost,
    });
  } catch (error) {
    // จัดการ error ที่เกิดขึ้น
    return res.status(500).send({
      message: error.message || "Some errors occurred while updating the post",
    });
  }
};

//========== ฟังก์ชัน: ลบ Blog Post (บรรทัดที่ 217-278) ==========
// ฟังก์ชันนี้ลบ post จากฐานข้อมูล
// เฉพาะผู้เขียน (author) เท่านั้นที่สามารถลบได้
exports.deletePost = async (req, res) => {
  // ดึง post ID จาก URL parameter
  const { id } = req.params;
  // ดึง author ID จาก JWT token
  const authorId = req.authorId;

  // ตรวจสอบว่า post ID มีค่าหรือไม่
  if (!id) {
    return res.status(400).send({
      message: "Post Id is missing",
    });
  }

  try {
    // ลบ post โดยตรวจสอบ ID และ author ID เพื่อให้มั่นใจว่าเป็นเจ้าของเท่านั้น
    const deletedPost = await PostModel.findOneAndDelete({
      _id: id,
      author: authorId,
    });

    // ถ้าไม่พบ post หรือไม่ใช่เจ้าของ
    if (!deletedPost) {
      return res.status(403).send({
        message:
          "Unauthorized: You are not the author of this post or post not found",
      });
    }

    // TODO: เพิ่มการลบไฟล์จาก Supabase Storage
    // const fileName = deletedPost.cover.split("/").pop();
    // await supabase.storage.from("blog-files").remove([`uploads/${fileName}`]);

    // ส่ง response สำเร็จ
    res.send({
      message: "Post deleted successfully",
      data: deletedPost,
    });
  } catch (error) {
    // จัดการ error ที่เกิดขึ้น
    return res.status(500).send({
      message: error.message || "Some errors occurred while deleting the post",
    });
  }
};
