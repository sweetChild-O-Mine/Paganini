import {GoogleGenAI} from '@google/genai'
import fs, { read, unwatchFile } from 'fs'
import dotenv from 'dotenv'
import { processAndUpload } from '../services/videoProcessor.js'
import {VideoSession} from '../models/VideoSession.js'
import {Message} from '../models/Message.js'
import { PutObjectCommand } from '@aws-sdk/client-s3'   
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client } from '../config/awsConfig.js'

dotenv.config()

// initialize the new client 

const analyzeVideo = async (req, res) => {

    // orihianl file trackers 
    let originalPath = null
    const totalStartTime = Date.now()

    let compressedPath = null

    try {

        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY,
            requestOptions: { timeout: 600000 }
         })


        if(!req.file) {
            return res.status(400).json({error: "File is missing!!!....just like her feelings for yaaa!!!!"})
        }

        originalPath = req.file.path
        // if the file is still there that means multer does it job nicely
        console.log("1. File received: ", originalPath);

        // Checking if compression needed
        console.log("...Checking if compression needed...");
        const result = await processAndUpload(originalPath, req.file.filename)

        const { pathForGemini, wasCompressed } = result

        compressedPath = result.compressedPath

        console.log("Will send to Gemini:", pathForGemini);
        console.log("was compressed", wasCompressed);

        // Uplaod to gemini 
        console.log("...Uploading to Gemini...");
        const uploadStartTime = Date.now()

        const uploadResult = await client.files.upload({
            file: pathForGemini,
            config: {
                mimeType: 'video/mp4',
                displayName: req.file.filename
            }
        })
        
        const uploadTime = ((Date.now() - uploadStartTime) / 1000).toFixed(2)
        console.log(`2. Uploaded to Gemini in ${uploadTime} : Gemini URI: ${uploadResult.uri}`);


        // wait for gemini to procees the stuff
        const processingStartTime = Date.now()
        let file = await client.files.get({name: uploadResult.name})

        while(file.state === "PROCESSING") {
            console.log("....PROCESSING (waiting 2s)...");
            await new Promise((resolve) => setTimeout(resolve, 2000))
            file = await client.files.get({name: uploadResult.name})
        }

        const processingTime = ((Date.now() - processingStartTime) / 1000).toFixed(2)
        console.log(`   Processing completed in ${processingTime}s`);

        if(file.state === "FAILED") {
            throw new Error("Gemini processing failed. Even AI needs a coffee break sometimes.")
        }

        console.log("3. Video Ready. Generating Content...");

        // gneerate analysis with LOW media resolution
        console.log("Analyzing with mediaResolution: 'low'...");

        // 3. Generate Content (Chat)
        const analysisStartTime = Date.now()
        let response = null

        for (let attempt = 1; attempt <= 3; attempt++){
            try {
                response = await client.models.generateContent({
                    model: 'gemini-2.5-flash',
                    config: {
                        // so that it will eat less tokens 
                        // mediaResolution: 'low'
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {fileData: {fileUri: uploadResult.uri, mimeType: uploadResult.mimeType}},
                                { text: "Give me a 3 line summary of the whole video. Baiscally it should give me the necesary info botu the video." }
                            ]
                        }
                    ]
                })

                console.log(`Attempt ${attempt} succeeded`);
                break
                
            } catch (error) {
                console.log(`Attempt ${attempt} failed: ${error.message}`);

                if(attempt < 3) {
                    console.log("Waiting 15 seconds before retry...");
                    await new Promise(r => setTimeout(r, 15000))
                } else {
                    throw error
                }
            }
        }

        // send response 
        console.log("4. successs!!!");

        const analysisTime = ((Date.now() - analysisStartTime) / 1000).toFixed(2)
        const totalTime = ((Date.now() - totalStartTime) / 1000).toFixed(2)
        
        console.log(`4. Analysis completed in ${analysisTime}s`);
        console.log(`═══════════════════════════════════════`);
        console.log(`📊 TOTAL TIME: ${totalTime}s`);
        console.log(`   Upload: ${uploadTime}s | Processing: ${processingTime}s | Analysis: ${analysisTime}s`);
        console.log(`═══════════════════════════════════════`);

        // clean up all the files 
        console.log("Deleting this messy  stuff nowww!!!");

        if(originalPath && fs.existsSync(originalPath)) {
            fs.unlinkSync(originalPath)
            console.log("Deleted original file:", originalPath);
        }

        // now compressed one 
        if(compressedPath && fs.existsSync(compressedPath)) {
            fs.unlinkSync(compressedPath)
            console.log("Deleted Compressed file:", compressedPath);
        }


        const newSessionAnalyzeVideo = await VideoSession.create({
            userId: req.user,
            title: "Uploaded Video Analysis",
            sourceType: 'UPLOAD',
            videoUrl: uploadResult.file.uri ,
            geminiFileUri: uploadResult.file.uri
        })
        
        await Message.create({
            // attach it to the receipt we just made
            sessionId: newSessionAnalyzeVideo._id,
            // from the gemini
            role: 'ai',
            text: response.text     //the summary text
        })

        // nice response for them ig 
        res.status(200).json({
            message: "Success!!",
            sessionId:newSessionAnalyzeVideo._id,
            wasCompressed,
            analysis: response.text,
            fileData: {
                uri: uploadResult.uri,
                name: uploadResult.name,
                mimeType: uploadResult.mimeType
            }
        })

    } catch (error) {
        console.log("We got error in aiController:", error.message);

        // delete the stuff here too 
        if(originalPath && fs.existsSync(originalPath)) {
            fs.unlinkSync(originalPath)
        }

        if(compressedPath && fs.existsSync(compressedPath)) {
            fs.unlinkSync(compressedPath)
        }

        res.status(500).json({
            error: error.message
        })
    }
};

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
        
        const  umiqueFileKey= `uploads/${req.user}/${Date.now()}-${fileName} `


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
            Key: uniqueFileKey
        })
    } catch (error) {
        console.error("Couldn't generate Signed URL")
        res.status(500).json({
            error: "Server failed to generate upload ticket"
        })

    }
}

// export this thing pweeeeasee
export { analyzeVideo, chatWithVideo, analyzeUrl, getSessionHistory, getUserSession, deleteSession, generateUploadUrl }