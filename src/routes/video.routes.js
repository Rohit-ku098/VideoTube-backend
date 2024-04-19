import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from '../controllers/video.controller.js';

import { upload } from '../middlewares/multer.middleware.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(verifyJwt) // Apply verifyJWT middleware to all routes in this file

router
.route('/')
.get(getAllVideos)
.post(
    upload.fields([
        {
            name: 'thumbnail',
            maxCount: 1
        },
        {
            name: 'videoFile',
            maxCount: 1
        }
    ]),
    publishAVideo
)

router
.route('/:videoId')
.get(getVideoById)
.patch(upload.single("thumbnail"),updateVideo)
.delete(deleteVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router