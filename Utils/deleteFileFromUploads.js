import path from "path";
import fs from "fs";

export function deleteFileFromUploads(filePathFromDb) {
  const fileName = filePathFromDb.replace(/^\/?uploads\//, "");

  const filePath = path.join("uploads", fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
