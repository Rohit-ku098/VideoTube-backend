import { Router } from "express";
import { getChannelStats, getChannelVideos } from '../controllers/dashboard.controller.js'
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { errorMiddleware } from "../middlewares/error.middleware.js";

const router = Router();

router.use(verifyJwt)
router.get('/stats', getChannelStats);
router.get('/videos', getChannelVideos);
router.use(errorMiddleware) // Response Middleware to check if there is an error
export default router 