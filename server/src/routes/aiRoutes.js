const express = require('express')
const router = express.Router()

// import the gateKeeper 
const upload = require('../middlewares/uploadMiddleware')

// import the manager 
const { analyzeVideo } = require('../controllers/aiController')

// now user is gonna send the data so we gonna need POST route for this  path's gonna be: /analyze

router.post('/analyze', upload.single('video'), analyzeVideo )

// export the router
module.exports = router