import {GoogleGenAI} from '@google/genai'
import dotenv from 'dotenv'
import {VideoSession} from '../models/VideoSession.js'
import {Message} from '../models/Message.js'
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'   
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client } from '../config/awsConfig.js'
import path from 'path'
import os from 'os'
import fs from 'fs'

dotenv.config()

// initialize the new client 

const chatWithVideo = async (req, res) => {
    try {
        const {prompt, fileData, sessionId} = req.body;

        if(!sessionId || !fileData || !fileData.uri) {
            return res.status(400).json({
                error: "URI not found "
            })
        }

        // save the user's question
        await Message.create({
            sessionId: sessionId,
            role: 'user',
            text:prompt
        })

        // make the client 
        const client = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})

        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {fileData: {
                            fileUri: fileData.uri,
                            mimeType: fileData.mimeType
                        }},
                        {text: prompt}
                    ]
                }
            ]
        })

        // save gemini's replyy too sirrr!!!!
        await Message.create({
            sessionId: sessionId,
            role:'ai',
            text: response.text
        })

        res.status(200).json({
            reply: response.text
        })


    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Gemini crashed. Probably because of your prompt." });
    }
}

const analyzeUrl = async (req, res) => {
    try {
        // get the stuff out of frontend using body
        const {videoLink} = req.body

        // trust issues fr...so validate
        if(!videoLink) {
            return res.status(400).json({
                error: "Provide a valid YouTube URL, Sir!!!"
            })
        }

        console.log('Starting analysis for URL:', videoLink);

        // gemini will start working from here 
        
        // make the client ig
        const client = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY})

        console.log("Sending YouTube link directly to Gemini 2.5 Flash sir...");

        // now we will play with the fileUri
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            // config: {
            //     mediaResolution: 'MEDIA_RESOLUTION_LOW'
            // },
            contents: [
                {
                    role: 'user',
                    parts: [
                        // here gemini will directly understand YouTube URIs
                        {
                            fileData: {fileUri: videoLink}
                        },

                        {
                            text: "Give me a 3 points summary of the whole video. Basically it should give me the neccessary info about the video."
                        }
                    ]
                }
            ]
        })

        console.log("Gemini Analysis Complete!!!");

        // save this receipt to the MONGODB
        // we know who the fuck user is coz of our great authMiddleware who gave req.user = userID

        // create videoSession 
        const newSession = await VideoSession.create({
            // and attach userId to this mfking videoSession
            userId: req.user,
            title: "YouTube Video Analysis",
            sourceType: "YOUTUBE",
            videoUrl: videoLink,
            geminiFileUri: videoLink
        })

        // save the first summary from gemini into chat hsitory
        await Message.create({
            sessionId: newSession._id,
            role: 'ai',
            text: response.text
        })


        // now we send the reponse bacck to React
        res.status(200).json({
            message: "Success!!!",
            sessionId: newSession._id,  //sedint this id to reasct so that she knwos ki kaunsa sesion hai yeh
            // basically React needs to tell the backend: "Hey, add this chat message to THIS SPECIFIC video session!"
            wasCompressed: false,
            analysis: response.text,
            fileData: {
                uri: videoLink, //pasing the yt link back so the caht route can use it
                name: "youtube_video",
                mimeType: "video/mp4"
            }
        })

    } catch (error) {
        console.log("Error in analysisUrl:", error.message);

        res.status(500).json({
            error: "The backend suffered a critical emotional event."
        })
    }
}

const getSessionHistory = async (req, res) => {
    try {
        // get the sessionId from url
        const {sessionId} = req.params

        // 2. find all the messages for this specific session using sessionId....and they should be sorted based on when they were created
        const messages = await Message.find({sessionId}).sort({
            createdAt: 1
        })

        return res.status(200).json({ messages })
    } catch (error) {
        console.error("Error fetchign history:", error)
        return res.status(500).json({
            error: "Failed to fetch chat history."
        })
    }
}

// queried MongoDB for all sessions belonging to that specific user and sorted them by the newest first
const getUserSession = async (req, res) => {
    try {
        // req.user contain your complete mongoDB profile including the object id => _id
        const id = req.user

        const videos = await VideoSession.find({userId: id}).sort({
            createdAt: -1
        })
        
        return res.status(200).json({ videos })
    } catch (error) {
        console.error("Error fetching videos:", error)
        return res.status(500).json({
            error: "Failed to fetch Videos"
        })
    }
}

// Delete session of the user
const deleteSession = async (req, res) => {
    try {
        // getthe otkne id 
        const { sessionId } = req.params
        
        // 1. delete the actual video session
        await VideoSession.findByIdAndDelete(sessionId)

        // 2. delete all the msgs belonged to that videosession
        await Message.deleteMany({sessionId: sessionId})

        res.status(200).json({
            message: "Vaule completely pruged"
        })
    } catch (error) {
        console.log("Error deleting session:", error);
        res.status(500).json({
            error: "Failed to delete session"
        })
    }
}

// generate signed url 
const generateUploadUrl = async (req, res) => {
    try {
        const { fileName, fileType } = req.body

        // 1. create a unique file name (key) so users dont overriw each other's video
        
        const  uniqueFileKey= `uploads/${req.user}/${Date.now()}-${fileName}`


        // tell aws ki wha the fuck we are putting in the bucket
        // use this for "Hey, prepare a slot in my bucket for this specific file
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME ,
            Key: uniqueFileKey ,
            ContentType: fileType
        })

        const signedUrl = await getSignedUrl(s3Client, command, {expiresIn: 300})



        return res.status(200).json({
            url: signedUrl,
            // snedin this so react madam know what's the name of the file 
            key: uniqueFileKey
        })
    } catch (error) {
        console.error("Couldn't generate Signed URL", error)
        res.status(500).json({
            error: "Server failed to generate upload ticket"
        })

    }
}

const processS3Video = async (req, res) => {
    // 1. react will send the exact key of file which she just uploaded
    // so get the key and the prompt from react
    const { s3Key, prompt }= req.body

    // 2. set up temporary home fo rhtis file nigg
    // os.tempdir() find the fault temp foleder on any OS
    const tempFilePath = path.join(os.tmpdir(), `paganini-${Date.now()}mp4`)

    try {
        console.log("1. Me(Express) Asking AWS ji for the file stream...");

        // 3. ask mfkin aws pleaeeee to send the file bytessss
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key
        })

        const s3Response = await s3Client.send(command)

        // stream to ssd to prevent ram overload bruhh
        console.log("2. Streaming to SSD to prevent RAM overload");

        // 4. the maigic pipeline which byPasses the ram fr 
 
        // 4. The Bulletproof Download (Bypassing the Stream Glitch)
        console.log("2. Downloading file from S3...");
        
        // This natively downloads the file from AWS
        const byteArray = await s3Response.Body.transformToByteArray();

        console.log("2.1 Started writing file to SSD");
        
        // Instantly write it to your SSD
        fs.writeFileSync(tempFilePath, byteArray);


        console.log("3. File succesFully saved to SSD");



        console.log("File Sucessfully saved to Disk:", tempFilePath);


        // Architecture step 5:- handle the file to geminni using mfk 
        console.log("4.Upalding to Google's Gemini...");

        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY,
            requestOptions: { timeout: 600000 }
        });

        const uploadResult = await client.files.upload({
            file: tempFilePath,
            config: {
                mimeType: 'video/mp4',
                displayName: "S3 Video Analysis"
            }
        })

        // architecture step 6: - the clean up 
        // so the moment gemini confirms reciept...we will delte the local file no : )
        console.log("5. Cleaning up local temp file.. ");
        fs.unlinkSync(tempFilePath)

        // the waiting game
        console.log("Waiting for Gemini processing...");
        let file = await client.files.get({name: uploadResult.name})

        while(file.state === "PROCESSING") {
            console.log("....PROCESSING (waiting 2s)...");
            await new Promise((resolve) => setTimeout(resolve, 2000))
            file = await client.files.get({name: uploadResult.name})
        }

        if(file.state === "FAILED") {
            throw new Error("Gemini processing failed.")
        }

        console.log("Video Ready. Generating Content...");

        // do the analysis now 
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                role: 'user',
                parts: [
                    {fileData: { 
                        fileUri : uploadResult.uri,
                        mimeType: uploadResult.mimeType
                    }},
                    {
                        text: prompt || "Give me a 3 line summary of the whole video."
                    }
                ]
            }]
        })

        // aechitecture step 3 : Save it to DB
        // contruct permanent s3 publix url so react can play it later 
        const s3PublicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

        const newSession = await VideoSession.create({
            userId: req.user, 
            title: "S3 Video Analysis",
            sourceType: "UPLOAD",
            videoUrl: s3PublicUrl,
            geminiFileUri: uploadResult.uri
        })

        // nowo create the message 
        await Message.create({
            sessionId: newSession._id,
            role: 'ai',
            text: response.text
        })

        // send the vidtory repsonse to our react ji 
        res.status(200).json({
            message: "Success!!!",
            sessionId: newSession._id,
            analysis: response.text,
            fileData: {
                uri: uploadResult.uri,
                mimeType: uploadResult.mimeType
            }
        })
    } catch (error) {
        console.error("Error Processing S3 Video", error)

        // bhagwan na kare but if gemini crashes, we still need to delete the local file 
        if(fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath)
        }

        res.status(500).json({
            error: "Failed to process video from S3!!!"
        })
    }
}


// export this thing pweeeeasee
export { chatWithVideo, analyzeUrl, getSessionHistory, getUserSession, deleteSession, generateUploadUrl, processS3Video }