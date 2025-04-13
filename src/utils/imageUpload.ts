import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const fileExt = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        cb(null, fileName);
    },
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export function getImageUrl(filename: string): string {
    const baseUrl = process.env.SERVER_BASE_URL || "http://localhost:5001";
    return `${baseUrl}/uploads/${filename}`;
}

export const deleteImage = (filename: string): boolean => {
    const filePath = path.join(uploadsDir, filename);

    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch (error) {
        return false;
    }

    return false;
};

export const getFilenameFromUrl = (url: string): string | null => {
    if (!url || !url.startsWith("/uploads/")) {
        return null;
    }

    return url.split("/").pop() || null;
};
