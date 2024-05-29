import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets
} from '../controllers/tweet.controller.js'
import { errorMiddleware } from "../middlewares/error.middleware.js";
const router = Router()

router.use(verifyJwt)

router.route("/").get(getAllTweets)
router.route("/").post(createTweet);
router.route("/u/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);
router.use(errorMiddleware) // Response Middleware to check if there is an error
export default router