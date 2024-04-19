import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subsciption.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // toggle subscription

  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Invalid channel id");

  if(channelId.toString() === req?.user?._id.toString()) throw new ApiError(400, "You cannot subscribe to yourself");
  
  let message = "";
  const subsciptionToggledData = {};

  const subscription = await Subscription.findOne({
    $and: [
      {
        subscriber: req.user._id,
      },
      {
        channel: channelId,
      },
    ],
  });

  if (!subscription) {
    const subscriptionData = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    if (!subscriptionData) throw new ApiError(500, "Failed to subscribe");
    subsciptionToggledData.isSubscribed = true;
    subsciptionToggledData.data = subscriptionData;
    message = `Subscribed to ${channelId}`;
  } else {
    const unSubscriptionData = await Subscription.findByIdAndDelete(
      subscription._id,
      {
        new: true,
      }
    );

    if (!unSubscriptionData) throw new ApiError(500, "Failed to unsubscribe");
    subsciptionToggledData.isSubscribed = false;
    subsciptionToggledData.data = unSubscriptionData;
    message = `Unsubscribed to ${channelId}`;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subsciptionToggledData, message));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // controller to return subscriber list of a channel
  const { channelId } = req.params;

  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Invalid channel id");

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "userSubscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$userSubscribers",
              },
            },
          },
          {
            $project: {
              _id: 1,
              avatar: 1,
              userName: 1,
              fullName: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$subscriber",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $replaceRoot: {
        newRoot: "$subscriber",
      },
    },
  ]);

  if (!subscribers) throw new ApiError(404, "Subscribers not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  // controller to return channel list to which user has subscribed
  const { subscriberId } = req.params;
  console.log(subscriberId);
  if (!isValidObjectId(subscriberId))
    throw new ApiError(400, "Invalid subscriber id");

  const subscriptions = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "channelSubscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: "$channelSubscribers",
              },
            },
          },
          {
            $project: {
              _id: 1,
              avatar: 1,
              userName: 1,
              fullName: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: {
        path: "$channel",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $replaceRoot: {
        newRoot: "$channel",
      },
    },
  ]);

  if (!subscriptions) throw new ApiError(404, "Subscriptions not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscriptions, "Subscriptions fetched successfully")
    );
});

const getSubscriptionStatus = asyncHandler(async (req, res) => {
  // controller to return subscription status
  const { channelId } = req.params;

  if (!isValidObjectId(channelId))
    throw new ApiError(400, "Invalid channel id");

  if (channelId.toString() === req.user._id.toString())
    throw new ApiError(400, "You cannot subscribe yourself");

  const subscription = await Subscription.findOne({
    subscriber: req?.user?._id,
    channel: channelId,
  });
  console.log(subscription);
  if (subscription) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: true },
          "Subscription status fetched successfully"
        )
      );
  } else {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          isSubscribed: false,
        },
        "Subscription status fetched successfully"
      )
    );
  }
});
export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getSubscriptionStatus,
};
