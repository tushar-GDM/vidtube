import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;
    if (!(err instanceof ApiError)) {
        const statusCode = err.statusCode || error instanceof mongoose.Error ? 400 : 500;
        const message = err.message || "Internal Server Error";

        error = new ApiError(statusCode, message, err.errors || [], err.stack);
    }
    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
    }
    return res.status(error.statusCode || 500).json(response);
};

export { errorHandler };
