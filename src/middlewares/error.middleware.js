import { ApiResponse } from "../utils/ApiResponse.js";

// Response Middleware to check if there is an error and return appropriate response
export const errorMiddleware = async (err, req, res, next) => {
    return res
    .status(err.statusCode || 500)
    .json(
        new ApiResponse(
            err.statusCode || 500,
            {},
            err.message
        )
    )
}