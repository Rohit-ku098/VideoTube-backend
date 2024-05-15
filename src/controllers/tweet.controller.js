import { Tweet } from '../models/tweet.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { isValidObjectId } from 'mongoose'


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content?.trim()) throw new ApiError(400, "Content is required")

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    await tweet.populate("owner", "userName fullName avatar")

    if (!tweet) throw new ApiError(500, "Failed to create tweet")

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            tweet,
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const tweets = await Tweet.find(
        {
            owner: userId
        }, 
        null,
        {
            sort: { createdAt: -1 }
        }
    ).populate("owner", "userName fullName avatar")

    if(!tweets) throw new ApiError(500, "Failed to fetch tweets")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "Tweets fetched successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id")
    if (!content?.trim()) throw new ApiError(400, "Content is required")

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content
        },
        {
            new: true
        }
    ).populate("owner", "userName fullName avatar")

    if(!updatedTweet) throw new ApiError(500, "Failed to update tweet")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet id")

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet) throw new ApiError(500, "Failed to delete tweet")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet deleted successfully"
        )
    )
})

const getAllTweets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 12, query, sortBy="createdAt", sortType = "desc", userId } = req.query;

  const queryObject = {};
  if (query) {
    queryObject.content = { $regex: query, $options: "i" };
  }
  if (userId) {
    queryObject.owner = userId;
  }
  const count = await Tweet.countDocuments(queryObject);
  const tweets = await Tweet.find(queryObject)
    .sort({ [sortBy]: sortType })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('owner',"avatar fullName userName")

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        tweets,
        "Tweets fetched successfully",
      )
    );

})
export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets
}