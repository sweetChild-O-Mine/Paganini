import express from 'express'
// import the gateKeeper 
import upload from '../middlewares/uploadMiddleware.js'
import { protect } from '../middlewares/authMiddleware.js'
import { deleteSession, getSessionHistory, getUserSession, generateUploadUrl } from '../controllers/aiController.js'

// import the manager 
import { analyzeVideo, chatWithVideo, analyzeUrl } from '../controllers/aiController.js'


const router = express.Router()


// now user is gonna send the data so we gonna need POST route for this  path's gonna be: /analyze

router.post('/analyze', protect ,upload.single('video'), analyzeVideo )

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

router.post('upload-url/', protect, generateUploadUrl)

// export the router
export default router;