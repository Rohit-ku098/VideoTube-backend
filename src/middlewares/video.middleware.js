import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";

const isVideoPublished = asyncHandler(async (req, _, next) => {
  try {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (!video.isPublished) throw new ApiError(403, "Video is not published");

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized access");
  }
});

const isVideoOwner = asyncHandler(async (req, _, next) => {
  try {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (req.user._id.toString() !== video.owner.toString())
      throw new ApiError(401, "Unauthorized access");

    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Unauthorized access");
  }
});
export {
    isVideoPublished,
    isVideoOwner
}