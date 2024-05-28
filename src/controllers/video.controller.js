import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteImageFromCloudinary, deleteVideoFromCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, query, sortBy, sortType = "asc", userId } = req.query;
  // Get all videos based on query, sort, pagination

  const queryObject = {};
  if (query) {
    queryObject.title = { $regex: query, $options: "i" };
    // queryObject.description = { $regex: query, $options: "i" };
  }

  if (userId) {
    queryObject.owner = userId;
  }

  queryObject.isPublished = true

  const count = await Video.countDocuments(queryObject);
  const videos = await Video.find(queryObject)
    .sort({ [sortBy]: sortType })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('owner',"avatar fullName userName")
    
  
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count, videos },
        "Videos fetched successfully"
      )
    )
  
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  // Get video, upload to cloudinary, create video

  if (!title) throw new ApiError(400, "Title is required");

  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  const videoLocalPath = req.files?.videoFile[0]?.path;

  if (!thumbnailLocalPath) throw new ApiError(400, "Thumbnail is required");
  if (!videoLocalPath) throw new ApiError(400, "Video is required");

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const video = await uploadOnCloudinary(videoLocalPath);

  if (!thumbnail || !video) throw new ApiError(500, "Failed to upload video");

  const newVideo = await Video.create({
    title: title.trim(),
    description: description,
    thumbnail: thumbnail.url,
    videoFile: video.url,
    owner: req.user._id,
    duration: video.duration,
    isPublished: isPublished || false, 
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      newVideo,
      "Video uploaded successfully"
    )
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // get video by id and increment views and add to watch history

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribers: {
                $size: "$subscribers",
              },
            },
          },
          {
            $project: {
              avatar: 1,
              fullName: 1,
              userName: 1,
              subscribers: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$likes",
        },
      },
    },
  ]);

  if (!video || video.length === 0) throw new ApiError(404, "Video not found");
  if (!video[0].isPublished) throw new ApiError(403, "Video is not published");

  await Video.findByIdAndUpdate(videoId, {
    $inc: { views: 1 },
  });


  //remove the video from watch history which is previously being watched
  await User.findByIdAndUpdate(req.user._id, {
    $pull: {
      watchHistory: {
        video: videoId,
      },
    },
  });

  // add the video to watch history
  const timestamp = new Date()
  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      watchHistory: {
        video: videoId,
        timestamp: timestamp,
      },
    },
  });

  

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
  
  const { title, description, isPublished } = req.body;
  const updatedFields = {};

  if(title && title.trim().length > 0)
    updatedFields.title = title.trim();

  if(description)
    updatedFields.description = description;
  
  if(isPublished !== undefined)
    updatedFields.isPublished = isPublished;
  
  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

    
  const thumbnailLocalPath = req.file?.path;
  if(thumbnailLocalPath)
  { 
      const oldThumbnail = video.thumbnail;
      const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
      if(!thumbnail)
          throw new ApiError(500, "Failed to upload thumbnail");

      const thumbnailDeleteResponse = await deleteImageFromCloudinary(oldThumbnail);
      if(!thumbnailDeleteResponse)
          throw new ApiError(500, "Failed to delete old thumbnail");

      updatedFields.thumbnail = thumbnail.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    updatedFields,
    {
        new: true
    }
  )

  if(!video) throw new ApiError(404, 'Video not found')

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      updatedVideo,
      "Video updated successfully"
    )
  )
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  const thumbnailDeleteResponse = await deleteImageFromCloudinary(video.thumbnail);
  const videoDeleteResponse = await deleteVideoFromCloudinary(video.videoFile);

  if (!thumbnailDeleteResponse || !videoDeleteResponse)
    throw new ApiError(500, "Failed to delete video");

  const commentsDeleteResponse = await Comment.deleteMany({ video: videoId });
  if(!commentsDeleteResponse)
    throw new ApiError(500, "Failed to delete videos comments");

  const likesDeleteResponse = await Like.deleteMany({ video: videoId });
  if(!likesDeleteResponse)
    throw new ApiError(500, "Failed to delete videos likes");
  
  await Video.findByIdAndDelete(videoId);

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "Video deleted successfully"
    )
  )
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  // toggle publish status
    const { videoId } = req.params;
    const { isPublished } = req.body;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
    if(!isPublished.toString()) throw new ApiError(400, "Video status is required");

    const video = await Video.findByIdAndUpdate(
      videoId, 
      {
        isPublished
      }, 
      {
        new: true
      }
    );
    
    if (!video) throw new ApiError(404, "Video not found");
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video status updated successfully"
        )
    )
});


export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};