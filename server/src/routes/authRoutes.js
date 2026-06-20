import express from 'express'
import { register, login, googleLogin } from '../controllers/authController.js'

const router = express.Router()

// post route for register
router.post('/register', register )

// post route for logn
router.post('/login', login )

// for google oauth 
router.post('/google',googleLogin)

// export the router mfk
export default router