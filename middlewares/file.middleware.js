// นำเข้า dependencies ที่จำเป็น
const multer = require("multer"); // ใช้จัดการ file upload
const path = require("path"); // ใช้จัดการ path ของไฟล์
const { createClient } = require("@supabase/supabase-js"); // Supabase SDK
const supabaseConfig = require("../config/supabase.config"); // Supabase configuration

// ดึงชื่อ bucket จาก .env
const SUPABASE_BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;
const bucketName = process.env.SUPABASE_BUCKET_NAME || "blog-files"; // ใช้ default ถ้ายังไม่มี

// สร้าง Supabase client โดยใช้ Service Role Key เพื่อมีสิทธิ์อัพโหลดไฟล์
// (Anon Key มีสิทธิ์จำกัด ต้องใช้ Service Role Key ในการอัพโหลด)
const supabase = createClient(
  supabaseConfig.supabaseUrl,
  supabaseConfig.supabaseServiceRoleKey || supabaseConfig.supabaseAnonKey
);
const supabaseStorage = supabase.storage;

//========== Multer Configuration ==========
// ตั้งค่า multer เพื่อเก็บไฟล์ในหน่วยความจำ (เตรียมส่งไปยัง Supabase)
const upload = multer({
  storage: multer.memoryStorage(), // เก็บในหน่วยความจำแทนดิสก์
  limits: { fileSize: 1000000 }, // จำกัดขนาดไฟล์ 1MB
  fileFilter: (req, file, cb) => {
    // เรียกฟังก์ชันตรวจสอบประเภทไฟล์
    checkFileType(file, cb);
  },
}).single("file"); // รับไฟล์เดียว ชื่อ "file"

//========== Function: ตรวจสอบประเภทไฟล์ ==========
// ฟังก์ชันนี้ตรวจสอบว่าไฟล์เป็นรูปภาพที่อนุญาตหรือไม่
function checkFileType(file, cb) {
  // ชนิดไฟล์ที่อนุญาต
  const fileTypes = /jpeg|jpg|png|gif|webp/;

  // ตรวจสอบนามสกุลไฟล์ (เช่น .jpg, .png)
  const extName = fileTypes.test(
    path.extname(file.originalname).toLocaleLowerCase()
  );

  // ตรวจสอบ MIME type (เช่น image/jpeg, image/png)
  const mimetype = fileTypes.test(file.mimetype);

  // ถ้าทั้ง extension และ mimetype ถูกต้อง อนุญาตให้ upload
  if (mimetype && extName) {
    return cb(null, true);
  } else {
    // ถ้าไฟล์ไม่ถูกต้อง ส่ง error
    cb(new Error("Error: Image files only (jpeg, jpg, png, gif, webp)"));
  }
}

//========== Middleware: Upload ไฟล์ไปยัง Supabase Storage ==========
// ฟังก์ชัน middleware นี้จัดการการอัพโหลดไฟล์ไปยัง Supabase Storage
async function uploadToSupabase(req, res, next) {
  // ถ้าไม่มีไฟล์ในการร้องขอ ข้ามไปขั้นตอนต่อไป
  if (!req.file) {
    console.log("No file to upload");
    next();
    return;
  }

  try {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน: timestamp + ชื่อเดิม
    const fileName = `${Date.now()}-${req.file.originalname}`;
    // กำหนด path ที่จัดเก็บไฟล์ใน Supabase
    const filePath = `uploads/${fileName}`;

    // อัพโหลดไฟล์ไปยัง Supabase bucket
    const { data, error } = await supabaseStorage
      .from(bucketName) // เลือก bucket
      .upload(filePath, req.file.buffer, {
        // อัพโหลดไฟล์จากหน่วยความจำ
        contentType: req.file.mimetype, // ระบุ MIME type ของไฟล์
      });

    // ถ้าเกิด error ในการอัพโหลด ทำการ throw error
    if (error) {
      throw error;
    }

    // ดึง public URL ของไฟล์จาก Supabase
    const { data: publicData } = supabaseStorage
      .from(bucketName)
      .getPublicUrl(filePath);

    // ตรวจสอบว่า URL ได้ถูกสร้างขึ้นมาหรือไม่
    if (!publicData || !publicData.publicUrl) {
      throw new Error("Failed to generate public URL from Supabase");
    }

    // เก็บ URL ในอ็อบเจ็กต์ req.file เพื่อใช้ในขั้นตอนต่อไป
    req.file.supabaseUrl = publicData.publicUrl;
    // แสดง log สำเร็จ
    console.log("✓ File uploaded successfully:", req.file.supabaseUrl);
    // ไปขั้นตอนต่อไป (controller)
    next();
  } catch (error) {
    // ถ้าเกิด error ส่ง response error ไปยัง client
    console.error("✗ Supabase upload error:", error.message);
    res.status(500).json({
      message:
        error.message || "Something went wrong while uploading to supabase",
    });
  }
}

module.exports = { upload, uploadToSupabase };
