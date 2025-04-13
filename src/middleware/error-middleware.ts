import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ApiError";
    }
}

export const notFoundHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
    next(error);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error("Error:", err);

    if (err instanceof ZodError) {
        res.status(400).json({
            message: "Validation error",
            errors: err.errors,
        });
        return;
    }

    if ('statusCode' in err) {
        const apiError = err as ApiError;
        res.status(apiError.statusCode).json({
            message: apiError.message,
        });
        return;
    }

    const statusCode = 500;
    const message = "Internal Server Error";
    const errorDetails = process.env.NODE_ENV === "development" ? err.stack : {};

    res.status(statusCode).json({
        message,
        ...(process.env.NODE_ENV === "development" && { error: errorDetails }),
    });
};
