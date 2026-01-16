const multer = require("multer");
const path = require("path");
const firebaseConfig = require("../config/firebase.config");

const {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} = require("firebase/storage");

const { initializeApp } = require("firebase/app");
const app = initializeApp(firebaseConfig);
const firebaseStorage = getStorage(app);

//set storage engine
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1000000 }, //1 MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single("file");

function checkFileType(file, cb) {
  const fileTypes = /jpeg|jpg|png|gif|webp/;
  const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (mimetype && extName) {
    return cb(null, true);
  } else {
    cb("Error Image Only!!");
  }
}

//upload to firebase storage
async function uploadToFirebase(req, res, next) {
  if (!req.file) {
    next();
    return;
  }
  //save location
  const storageRef = ref(firebaseStorage, `uploads/${req.file.originalname}`);

  const metadata = {
    contentType: req.file.mimetype,
  };
  try {
    const snapshot = await uploadBytesResumable(
      storageRef,
      req.file.buffer,
      metadata
    );
    //get url from firebase
    req.file.firebaseURL = await getDownloadURL(snapshot.ref);
    next();
  } catch (error) {
    res.status(500).json({
      message:
        error.message || "something went wrong while uploading to firebase!",
    });
  }
}

module.exports = { upload, uploadToFirebase };
