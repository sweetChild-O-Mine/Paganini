import express from 'express'
// import the gateKeeper 
import { protect } from '../middlewares/authMiddleware.js'
import { deleteSession, getSessionHistory, getUserSession, generateUploadUrl, processS3Video, analyzeInstagram } from '../controllers/aiController.js'

// import the manager 
import { chatWithVideo, analyzeUrl } from '../controllers/aiController.js'


const router = express.Router()

// for chat with video thing
router.post('/chat', protect, chatWithVideo)

// for yt video
router.post('/analyze-url', protect, analyzeUrl)

// get all the sessions of any specific user using this route
router.get('/sessions', protect, getUserSession)

// the get route to get the chat from the db 
router.get('/session/:sessionId', protect, getSessionHistory)

// to delete the mfking session
router.delete('/session/:sessionId', protect, deleteSession)

router.post('/upload-url', protect, generateUploadUrl)

router.post('/process-s3', protect, processS3Video)

// route efor insta reels
router.post('/analyze-instagram', protect, analyzeInstagram)

// export the router
export default router;