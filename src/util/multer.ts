import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "./public/data/uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now();
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

export default upload;
