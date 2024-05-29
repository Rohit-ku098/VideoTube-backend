import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
  getLikeInfo
} from "../controllers/like.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";
import { errorMiddleware } from "../middlewares/error.middleware.js";

const router = Router();
router.use(verifyJwt); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route('/v/:videoId').get(getLikeInfo);
router.route('/c/:commentId').get(getLikeInfo);
router.route('/t/:tweetId').get(getLikeInfo);
router.route("/videos").get(getLikedVideos);
router.use(errorMiddleware) // Response Middleware to check if there is an error
export default router;
