import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subsciption.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user._id;
  const stats = await User.aggregate([
    {
      $match: {
        _id : new mongoose.Types.ObjectId(userId)
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $project: {
              views: 1,
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "tweets",
        pipeline: [
          {
            $project: {
              _id: 1,
            }
          }
        ]
      }
    },
    {
      $lookup: {
        from: "playlists",
        localField: "_id",
        foreignField: "owner",
        as: "playlists",
        pipeline: [
          {
            $project: {
              _id: 1,
            }
          }
        ]
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        videosCount: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        tweetsCount: {
          $size: "$tweets",
        },
        playlistsCount: {
          $size: "$playlists",
        }
      }
    },
    {
      $project: {
        _id: 1,
        userName:1,
        fullName: 1,
        avatar: 1,
        coverImage:1,
        subscribersCount: 1,
        videosCount: 1,
        totalViews: 1,
        tweetsCount: 1,
        playlistsCount: 1,
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      stats[0],
      "Channel stats fetched successfully"
    )
  )
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user._id;
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      }
    },
    {
      $addFields: {
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        }
      }
    },
    {
      $project: {
        videoFile: 0,
        likes: 0,
        comments: 0,
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      videos,
      "Channel videos fetched successfully"
    )
  )
});

export { getChannelStats, getChannelVideos };