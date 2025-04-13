import fs from "fs";
import path from "path";

interface FileOptions {
    encoding?: BufferEncoding;
    flag?: string;
}

export class FileOps {
    static readJsonFile = <T>(filePath: string, options?: FileOptions): T[] => {
        try {
            const fullPath = path.resolve(__dirname, "..", filePath);

            if (!fs.existsSync(fullPath)) {
                fs.writeFileSync(fullPath, JSON.stringify([]), { encoding: "utf8" });
                return [];
            }

            const data = fs.readFileSync(fullPath, {
                encoding: options?.encoding || "utf8",
                flag: options?.flag || "r",
            });

            return JSON.parse(data.toString()) as T[];
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return [];
        }
    };

    static writeJsonFile = <T>(filePath: string, data: T[], options?: FileOptions): boolean => {
        try {
            const fullPath = path.resolve(__dirname, "..", filePath);
            const dirPath = path.dirname(fullPath);

            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            fs.writeFileSync(
                fullPath,
                JSON.stringify(data, null, 2),
                { encoding: options?.encoding || "utf8" }
            );

            return true;
        } catch (error) {
            console.error(`Error writing to file ${filePath}:`, error);
            return false;
        }
    };
}