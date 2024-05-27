import { Router } from "express";
import { getChannelStats, getChannelVideos } from '../controllers/dashboard.controller.js'
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt)
router.get('/stats', getChannelStats);
router.get('/videos', getChannelVideos);

export default router 