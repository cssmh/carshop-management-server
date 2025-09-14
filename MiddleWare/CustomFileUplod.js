// middleware/CustomFileUplod.js
import multer from "multer";
import fs from "fs";

// Method 4: Custom Middleware with Parameter
export const createUpload = (
  folder,
  fileSizeLimit = 10 //10 mb file size default
) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadFolder = `uploads/${folder}/`;
      if (!fs.existsSync(uploadFolder)) {
        fs.mkdirSync(uploadFolder, { recursive: true });
      }
      cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
      cb(null, folder + "_" + Date.now() + "_" + file.originalname);
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: fileSizeLimit * 1024 * 1024,
    },
  }).any();
};
