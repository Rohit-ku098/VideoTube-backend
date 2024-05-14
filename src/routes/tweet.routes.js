import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets
} from '../controllers/tweet.controller.js'
const router = Router()

router.use(verifyJwt)

router.route("/").get(getAllTweets)
router.route("/").post(createTweet);
router.route("/u/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router