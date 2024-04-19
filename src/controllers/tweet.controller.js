import { Tweet } from '../models/tweet.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { isValidObjectId } from 'mongoose'


const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content) throw new ApiError(400, "Content is required")

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

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

    const tweets = await Tweet.find(
        {
            owner: req.user._id 
        }, 
        null,
        {
            sort: { createdAt: -1 }
        }
    )

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
    if (!content) throw new ApiError(400, "Content is required")

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content
        },
        {
            new: true
        }
    )

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

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}