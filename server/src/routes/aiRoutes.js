import express from 'express'
// import the gateKeeper 
import upload from '../middlewares/uploadMiddleware.js'

// import the manager 
import { analyzeVideo } from '../controllers/aiController.js'

const router = express.Router()


// now user is gonna send the data so we gonna need POST route for this  path's gonna be: /analyze

router.post('/analyze', upload.single('video'), analyzeVideo )

// export the router
export default router;