import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Video } from '../models/video.model.js'
import { User } from '../models/user.model.js'
import { Like } from '../models/like.model.js'
import { Tweet } from '../models/tweet.model.js'
import { Comment } from '../models/comment.model.js'
import mongoose,{ isValidObjectId } from 'mongoose'

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    const like = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    })

    const likedData = {}
    let message = "";
    if (!like) {
        const videoLike = await Like.create({
            likedBy: req.user._id,
            video: videoId
        })

        if(!videoLike) throw new ApiError(500, "Failed to like video")

        likedData.isLiked = true;
        message = "Video liked successfully"
    } else {
        const videoLike = await Like.findByIdAndDelete(like._id)
        if(!videoLike) throw new ApiError(500, "Failed to unlike video")

        likedData.isLiked = false;
        message = "Video unliked successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedData,
            message
        )
    )

})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if(!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment id")

    const comment = await Comment.findById(commentId)
    if(!comment) throw new ApiError(404, "Comment not found")

    const like = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId
    })
    
    const likedData = {}
    let message = "";
    if(!like) {
        const commentLike = await Like.create({
            likedBy: req.user._id,
            comment: commentId
        })

        if(!commentLike) throw new ApiError(500, "Failed to like comment")

        likedData.isLiked = true;
        message = "Comment liked successfully"
    } else {
        const commentLike = await Like.findByIdAndDelete(like._id)
        if(!commentLike) throw new ApiError(500, "Failed to unlike comment")

        likedData.isLiked = false;
        message = "Comment unliked successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedData,
            message
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if(!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id")

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) throw new ApiError(404, "Tweet not found")

    const like = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId
    })
    
    const likedData = {}
    let message = "";
    if(!like) {
        const tweetLike = await Like.create({
            likedBy: req.user._id,
            tweet: tweetId
        })

        if(!tweetLike) throw new ApiError(500, "Failed to like tweet")

        likedData.isLiked = true;
        message = "Tweet liked successfully"
    } else {
        const tweetLike = await Like.findByIdAndDelete(like._id)
        if(!tweetLike) throw new ApiError(500, "Failed to unlike tweet")

        likedData.isLiked = false;
        message = "Tweet unliked successfully"
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedData,
            message
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
   
    const likedVideos = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(req.user._id),
          video: {
            $ne: null
          },
        },
      },
     {
        $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video",
        }
     },
     {
        $addFields: {
            video: {
                $first: "$video"
            }
        }
     },
     {
        $replaceRoot: {
            newRoot: "$video"
        }
     },
     
    ]);

    if(!likedVideos) throw new ApiError(500, "Unable to fetch liked videos")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    )
})

const getLikeInfo = asyncHandler(async (req, res) => {
  const { videoId, commentId, tweetId } = req.params;
  const likeInfo = await Like.find({
    video: videoId,
    comment: commentId,
    tweet: tweetId,
  });

  const userLike = likeInfo.find((like) => like.likedBy.toString() === req.user._id.toString());
  
  if (likeInfo) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
            totalLike: likeInfo.length,
            isLiked: userLike? true : false
        },
        "Like fetched successfully"
      )
    );
  } else {
    throw new ApiError(500, "Unable to fetch like info");
  }
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
    getLikeInfo
}