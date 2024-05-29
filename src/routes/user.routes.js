import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  clearWatchHistory,
  removeVideoFromWatchHistory,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { errorMiddleware } from "../middlewares/error.middleware.js";
const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser, errorMiddleware)

//secured routes
router.route('/logout').post(verifyJwt, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJwt, changePassword)
router.route('/current-user').get(verifyJwt, getCurrentUser)
router.route('/update-account').patch(verifyJwt, updateAccountDetails)
router.route('/update-avatar').patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route('/update-cover-image').patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)
router.route('/c/:username').get(verifyJwt, getUserChannelProfile)
router.route('/watch-history')
.get(verifyJwt, getWatchHistory)
.patch(verifyJwt, clearWatchHistory)

router.route('/watch-history/:videoId').patch(verifyJwt, removeVideoFromWatchHistory)
router.use(errorMiddleware) // Response Middleware to check if there is an error
export default router;