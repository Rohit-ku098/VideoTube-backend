import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";


const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");
    if (!content?.trim()) throw new ApiError(400, "Comment is required");

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const comment = await Comment.create({
        content,
        owner: req.user._id,
        video: videoId
    })
     const newComment = await comment.populate({
        path: "owner",
        select: "userName fullName avatar"
    })
    if (!comment) throw new ApiError(500, "Failed to create comment");

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            newComment,
            "Comment created successfully"
        )
    )
})

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(404, "Video not found");

    let comments = await Comment.find(
        {
            video: videoId
        },
        {},
        {
            populate: {
                path: "owner",
                select: "userName fullName avatar"
            }
        }
    );
    if(!comments) throw new ApiError(404, "Comments not found");

     const currentUserCommentIndex = comments.findIndex(
       (comment) => comment.owner._id.toString() === req?.user._id.toString()
     );
     const currentUserComment = comments.splice(currentUserCommentIndex, 1);

     // Concatenate the current user's comment to the beginning of the comments array
     comments = currentUserComment.concat(comments);


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if(!isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment id");
    if(!content?.trim()) throw new ApiError(400, "Comment is required");

    const comment = await Comment.findById(commentId);
    if(!comment) throw new ApiError(404, "Comment not found");

    if(comment.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to update this comment");

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content
        },
        {
            new: true,
            populate: {
                path: "owner",
                select: "userName fullName avatar"
            }
        }
    );

    if (!updatedComment) throw new ApiError(500, "Failed to update comment");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if(!isValidObjectId(commentId)) throw new ApiError("Invalid comment id");

    const comment = await Comment.findById(commentId);
    if(!comment) throw new ApiError(404, "Comment not found");

    if(comment.owner.toString() !== req.user._id.toString()) throw new ApiError(403, "You are not authorized to delete this comment");
    
    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if(!deletedComment) throw new ApiError(500, "Unable to delete comment");

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})

export {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
}