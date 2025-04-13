import { Request, Response, NextFunction } from "express";

export const setCacheControl = (maxAge: number) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.headers.authorization) {
            res.setHeader("Cache-Control", "private, max-age=0, no-cache");
        } else {
            res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
        }
        next();
    };
};

export const enableServiceWorkerCaching = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
};
