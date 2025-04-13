import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { ZodError } from "zod";
import { FileOps } from "../utils/fileOps";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/token";
import { userSchema, loginSchema } from "../schemas";
import { User, UserRole } from "../types";

const USER_FILE_PATH = "data/users.json";

export const signup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validatedData = userSchema.parse(req.body);
        const users = FileOps.readJsonFile<User>(USER_FILE_PATH);
        if (users.some((user) => user.email === validatedData.email)) {
            res.status(409).json({ message: "Email already in use" });
            return;
        }
        const hashedPassword = await hashPassword(validatedData.password);
        const now = new Date().toISOString();
        const newUser: User = {
            id: uuidv4(),
            name: validatedData.name,
            email: validatedData.email,
            password: hashedPassword,
            role: validatedData.role as UserRole,
            mobile: validatedData.mobile,
            createdAt: now,
            updatedAt: now,
        };
        users.push(newUser);
        FileOps.writeJsonFile(USER_FILE_PATH, users);
        const token = generateToken(newUser);
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json({
            message: "User created successfully",
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }
        next(error);
    }
};

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const validatedData = loginSchema.parse(req.body);
        const users = FileOps.readJsonFile<User>(USER_FILE_PATH);
        const user = users.find((user) => user.email === validatedData.email);
        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        const isPasswordValid = await comparePassword(
            validatedData.password,
            user.password
        );
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        const token = generateToken(user);
        const { password, ...userWithoutPassword } = user;
        res.status(200).json({
            message: "Login successful",
            user: userWithoutPassword,
            token,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }
        next(error);
    }
};

export const getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const users = FileOps.readJsonFile<User>(USER_FILE_PATH);
        const user = users.find((user) => user.id === userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
        const users = FileOps.readJsonFile<User>(USER_FILE_PATH);
        const userIndex = users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const validatedData = userSchema
            .partial()
            .omit({ password: true })
            .parse(req.body);
        if (
            validatedData.email &&
            validatedData.email !== users[userIndex].email &&
            users.some((user) => user.email === validatedData.email)
        ) {
            res.status(409).json({ message: "Email already in use" });
            return;
        }
        const updatedUser = {
            ...users[userIndex],
            ...validatedData,
            updatedAt: new Date().toISOString(),
        };
        users[userIndex] = updatedUser;
        FileOps.writeJsonFile(USER_FILE_PATH, users);
        const { password, ...userWithoutPassword } = updatedUser;
        res.status(200).json(userWithoutPassword);
    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                message: "Validation error",
                errors: error.errors,
            });
            return;
        }
        next(error);
    }
};
