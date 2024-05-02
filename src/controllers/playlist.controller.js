import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if (!name?.trim()) throw new ApiError(400, "Name is required")

    const playlist = await Playlist.create({
        name: name.trim(),
        description,
        owner: req.user._id
    })

    if(!playlist) throw new ApiError(500, "Failed to create playlist")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist created successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id")

    const playlist = await Playlist.findById(playlistId)
      .populate("owner", "userName fullName avatar")
      .populate("videos", "thumbnail title duration views createdAt")
      .populate({
        path: "videos",
        populate: {
            path: "owner",
            select: "userName fullName avatar"
        }
      })
    

    if(!playlist) throw new ApiError(404, "Playlist not found")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id")

    const playlistObject = {}
    if(name?.trim()) {
        playlistObject.name = name.trim()
    }

    if(description) {
        playlistObject.description = description
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        playlistObject,
        {
            new: true
        }
    )

    if(!playlist) throw new ApiError(500, "Failed to update playlist")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully"
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id")

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if(!playlist) throw new ApiError(500, "Failed to delete playlist")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id") 
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id") 

    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404, "Playlist not found")

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) throw new ApiError(500, "Failed to add video")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video added to playlist successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {videoId, playlistId} = req.params

    if(!isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist id")
    if(!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id")

    const playlist = await Playlist.findById(playlistId)
    if(!playlist) throw new ApiError(404, "Playlist not found")

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) throw new ApiError(500, "Failed to remove video")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video removed from playlist successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id")

    const playlists = await Playlist.find({owner: userId})
    if(!playlists) throw new ApiError(404, "Playlists not found")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "Playlists fetched successfully"
        ) 
    )
})

const getChannelPlaylists = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  const channel = await User.findOne({userName: userName});
  if (!channel) throw new ApiError(404, "User not found");

  const playlists = await Playlist.find({ owner: channel?._id });
  if (!playlists) throw new ApiError(404, "Playlists not found");

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

export {
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  getUserPlaylists,
  getChannelPlaylists,
};