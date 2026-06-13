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
import axios from 'axios'
import { pipeline } from 'stream/promises'
import { myQueue } from '../queues/videoQueue.js'

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
                            text: `Analyze this video and return ONLY a raw JSON object with two fields:
                            "title": A catchy, short title for the video (max 5 words).
                            "summary": A 3-line summary of what happens in the video.
                            Do not include markdown formatting or backticks.`
                        }
                    ]
                }
            ]
        })

        console.log("Gemini Analysis Complete!!!");

        const cleanJson = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const aiData = JSON.parse(cleanJson);

        // save this receipt to the MONGODB
        // we know who the fuck user is coz of our great authMiddleware who gave req.user = userID

        // create videoSession 
        const newSession = await VideoSession.create({
            // and attach userId to this mfking videoSession
            userId: req.user,
            title: aiData.title,
            sourceType: "YOUTUBE",
            videoUrl: videoLink,
            geminiFileUri: videoLink
        })

        // save the first summary from gemini into chat hsitory
        await Message.create({
            sessionId: newSession._id,
            role: 'ai',
            text: aiData.summary
        })


        // now we send the response bacck to React
        res.status(200).json({
            message: "Success!!!",
            sessionId: newSession._id,  //sedint this id to reasct so that she knwos ki kaunsa sesion hai yeh
            // basically React needs to tell the backend: "Hey, add this chat message to THIS SPECIFIC video session!"
            wasCompressed: false,
            analysis: aiData.summary ,
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
    // const tempFilePath = path.join(os.tmpdir(), `paganini-${Date.now()}mp4`)

    try {
        const job = await myQueue.add("process-s3-video", {
            s3Key,
            prompt,
            userId: req.user
        })

        return res.status(202).json({
            message: "Your video is being processed",
            jobId: job.id
        })
    } catch (error) {
        console.error("Error Processing S3 Video", error)

        res.status(500).json({
            error: "Failed to process video from S3!!!"
        })
    }
}

const analyzeInstagram = async (req, res) => {
    let tempFilePath = null

    try {
        // check if the actuall stuff exist or not 
        const { instagramUrl } = req.body
           
        if(!instagramUrl) {
            return res.status(400).json({
                error: "Provide a valid Instagram reel url"
            })
        }

        // we neet shortcode 
        const regex = /\/(?:p|reel)\/([a-zA-Z0-9_-]+)/;

        const match = instagramUrl.match(regex);
        const shortcode = match ? match[1] : null
        
        if(!shortcode) {
            return res.status(400).json({

                error: "Invalid Instagram URL format. Could not find shortcode."

            })
        }

        console.log("shortcode found in URL is", shortcode);

        
        console.log("1. Interogating RapidAPI for the raw mp4 link...");

        // url
        const rapidApiUrl = "https://instagram120.p.rapidapi.com/api/instagram/mediaByShortcode"

        // api call now 
        // axios.post(URL, BODY, CONFIG_AND_HEADERS)
        const rapidApiResponse = await axios.post(
            rapidApiUrl,  //url
            {
                shortcode: shortcode
            },
            {
                headers: {
                    'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                    'x-rapidapi-host': 'instagram120.p.rapidapi.com', // Tera RapidAPI host
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        )

        console.log(rapidApiResponse);

        const data = rapidApiResponse.data

        if(!data || !data[0] || !data[0].urls || !data[0].urls[0] || !data[0].urls[0].url ) {
            throw new Error("RapidAPI betrayed us. No video URL found in the payload.")
        }

        // extact the url form it now
        const rawVideoUrl = data[0].urls[0].url

        console.log("Got the raw MP4 URL! Commencing the heist...");

        console.log(rawVideoUrl);

        // work from here 
        // generate temp home for our video
        tempFilePath = path.join(os.tmpdir(), `instagram-${Date.now()}.mp4`)

        console.log("2. Streaming the video directly to disk(Bypassing RAM)...");

        // tell axios we want the stream not the whole file
        const videoStreamResponse = await axios({
            method: 'get',
            url: rawVideoUrl,
            responseType: 'stream',
            timeout: 30000  // give it 30 seconds to startsending data
        })

        // the god teir Ram Bypass 
        await pipeline(
            videoStreamResponse.data,
            fs.createWriteStream(tempFilePath)
        )

        console.log("3. File successfully staged on SSD:", tempFilePath);

        // the s3 stuff
        const s3Key = `uploads/${req.user}/instagram/${Date.now()}.mp4`

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: s3Key,
            ContentType: 'video/mp4',
            Body: fs.createReadStream(tempFilePath)
        })

        await s3Client.send(command)

        console.log("S3 Smuggle Completed!!!");

        // the gemini stuff nowww
        const client = new GoogleGenAI({
            apiKey:process.env.GEMINI_API_KEY,
        })

        // upload the file to gemini 
        const uploadResult = await client.files.upload({
            file: tempFilePath,
            config: {
                mimeType: 'video/mp4',
                displayName: 'S3 Insta Reel Analysis'
            }
        })
        console.log("5. Uploaded to Gemini. Waiting for it to process..");

        //1. the polling loop thing 
        let file = await client.files.get({ name: uploadResult.name })

        // do the looping mfk

        let retries = 0
        const MAX_RETRIES = 30
        while(file.state === "PROCESSING" && retries < MAX_RETRIES) {
            console.log(`...PROCESSING {Attempt ${retries + 1}/${MAX_RETRIES}} `);
            await new Promise((resolve) => setTimeout(resolve, 3000))
            file = await client.files.get({ name: uploadResult.name })

            retries++

        }

        if(file.state === "FAILED") {
            throw new Error("Gemini processing failed.")
        }

        // check if its failed or not 
        if(file.state === "PROCESSING") {
            throw new Error("Gemini processing failed. The video might be corrupted.")
        }

        console.log("6. Video Ready. Asking Gemini for a summary...");

        // 2. ask the gemini for the summary now
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{
                role: 'user',
                parts: [
                    { fileData: {
                        fileUri: uploadResult.uri, 
                        mimeType: uploadResult.mimeType
                    } },
                    {
                        text: `Analyze this video and return ONLY a raw JSON object with two fields:
                        "title": A catchy, short title for the video (max 5 words).
                        "summary": A 3-line summary of what happens in the video.
                        Do not include markdown formatting or backticks.`  
                    }
                ]
            }]
        })

        console.log("7. Gemini Analysis Complete. Saving to Database...");

        const cleanJson = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();

        const aiData = JSON.parse(cleanJson);        

        // 3. construct the permant 
        const s3PublicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

        // 4. save to mongoDB
        const newSession = await VideoSession.create({
            userId: req.user,
            title: aiData.title,
            sourceType: 'INSTAGRAM',
            videoUrl: s3PublicUrl,
            geminiFileUri: uploadResult.uri
        })

        await Message.create({
            sessionId: newSession._id,
            role: 'ai',
            text: aiData.summary
        })

        // send it back to the clinet so we can test if step 1 works
        return res.status(200).json({
            message: "File downloaded!",
            sessionId: newSession._id,
            analysis: aiData.summary ,
            playableUrl: rawVideoUrl,
            fileData: {
                uri: uploadResult.uri, 
                mimeType: uploadResult.mimeType
            }
        })
        
    } catch (error) {
        console.error("The Heist Failed:", error.message);
        res.status(500).json({ error: "RapidAPI decided to take a nap." });
    } finally {
        // check if file exist or not
        if(tempFilePath && fs.existsSync(tempFilePath)) {
            await fs.promises.unlink(tempFilePath)
            console.log("....CLEANED THE DISK....");
        }
    }
}

// export this thing pweeeeasee
export { chatWithVideo, analyzeUrl, getSessionHistory, getUserSession, deleteSession, generateUploadUrl, processS3Video, analyzeInstagram }