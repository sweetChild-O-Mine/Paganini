import {User} from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'

// googleClient 
const googleClient = new OAuth2Client({
    client_id: process.env.GOOGLE_CLIENT_ID
})

export const register = async (req, res) => {

    const {name, email, password} = req.body

    if(!name || !email || !password) {
        return res.status(400).json({
            error: "Enter the valid credentials sirrrr!!!!"
        })
    }

    try {
        // find if this mfking user's email already there or not
        const existingUser = await User.findOne({email: email})
        // existingUser is object btw

        // cleared so stupid doubt here but xd

        if(existingUser) {
            return res.status(400).json({
                error: "User with this email already exists....Sirrr!!!!"
            })
        }

        

        // 4. the actually magic will take place here by salting and hasing 
        // '10' here is the salt rounds basically bcrypt will hash it it 2^10 times...like imagineee
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // 5.create new user with the Hashed Password
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword    //we never pass the password here...iykyk
        })
        // here mongoDB will autometially generate a mathemntcially unique ID and will attach to object
        // usig the key _id so basically u do 
        // newUser._id = you'll get some random oweiruwi1231 id 


        // 6.NOW GENERATE THE TOKENNNNNN (JWT)
        const token = jwt.sign(
            {userId: newUser._id},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        )

        // 7. now send the token and user data back to the frontend
        return res.status(201).json({
            message: "User registered successfully",
            token:token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Server went up in flames"
        })
    }
}

export const login = async (req, res) => {
    // 1. get the data first mfk 
    const {email, password} = req.body

    // 2. call the bouncersss first
    if(!email || !password) {
        return res.status(400).json({
            error: "Enter valid credentials sirrrr!!!!"
        })
    }

    try {
        // 3. find the user from the DB
        const foundUser = await User.findOne({email})
        // this found User thing contain the user object inclduing the Hpw

        // if couldnt find user then say user dont exist 
        if(!foundUser) {
            return res.status(400).json({
                error: "Couldn't find user with the entered email."
            })
        }

        // match if the entered password matches with our stuff
        const isMatch = await bcrypt.compare(password, foundUser.password )

        // if not matched then kick him out by saying wrong password nigga
        if(!isMatch) {
            return res.status(401).json({
                error: "Wrong Password"
            })
        }

        // if his pw matches then just generate JWT wristband (token) in the same way
        const token = jwt.sign(
            {userId: foundUser._id},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        )


        return res.status(200).json({
            message: "LoggedIn successfully",
            token: token,
            // send the user too
            user: {
                userId: foundUser._id,
                name: foundUser.name,
                email: foundUser.email
            }
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            error: "Server is burning..."
        })
    }
}

export const googleLogin = async (req, res) =>{
    console.log("react send us a token:", req.body.token);
    try {
        const { token } = req.body

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        })

        // extract 
        const payload =ticket.getPayload()
        const email = payload.email
        const name = payload.name

        console.log("Verified Google User:", name, email);

        // check if the user exist in mognodb or not 
        let user = await User.findOne({ email })

        // 2. if they dont then add a brand new user and create them 
        if(!user) {
            const randomPassword = crypto.randomBytes(16).toString('hex')
            const hashedPassword = await bcrypt.hash(randomPassword, 10)

            user = await User.create({
                name: name,
                email: email,
                password: hashedPassword
            })
        }

        const paganiniToken = jwt.sign(
            {id: user._id},
            process.env.JWT_SECRET,
            {expiresIn: '7d'}
        )

        // send the exact same response as a normal login to frontend
        res.status(200).json({
            message: "Google Login Successful",
            token: paganiniToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        console.log("Google Auth Error:", error);
        res.status(401).json({
            error: "Invalid Google Token"
        })
    }
}