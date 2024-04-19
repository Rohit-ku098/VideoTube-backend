import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";

const isVideoPublished = async (req, _, next) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (!video.isPublished) throw new ApiError(403, "Video is not published");

    next();
};

export {
    isVideoPublished
}