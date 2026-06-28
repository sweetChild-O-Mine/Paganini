import { Worker } from "bullmq";
import { connection } from "../config/redisConnection.js";
import { VideoSession } from '../models/VideoSession.js'
import os from 'os'
import { s3Client } from '../config/awsConfig.js'
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs'
import { GoogleGenAI } from "@google/genai";
import { Message } from "../models/Message.js";
import path from "path";
import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import axios from "axios";
import { pipeline } from "stream/promises";

// load the env 
dotenv.config()
await connectDB()

// define the worker 
const worker = new Worker(
    "video-processing",  //must be same as queue name
    // the fucntion that will run for every single job
    async (job) => {

        // job.name :- gonna the name we get from controller so it can be "video-processing"

        // job.data -> the payload data u pass in the controller 
        // { s3Key, prompt, userId }
        // so here basically req.user -> job.data.userId

        if (job.name === "process-s3-video") {
            // all the normal s3 stuff
            // 1. get the temp file path first to make it work 
            const tempFilePath = path.join(os.tmpdir(), `paganini-${Date.now()}mp4`)

            try {

                const s3Key = job.data.s3Key
                const prompt = job.data.prompt



                console.log("1. Me(Express) Asking AWS ji for the file stream...");

                const command = new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: s3Key
                })

                const s3Response = await s3Client.send(command)

                // stream the videoFile to ssd ro prevent ram overlaod 
                console.log("2. Streaming to SSD to prevent RAM overlaod :) ");

                const byteArray = await s3Response.Body.transformToByteArray()

                // now write the file to ssd
                console.log("2.1 Started writing file to SSD");

                // write it to your ssd
                fs.writeFileSync(tempFilePath, byteArray)

                console.log("3. File successfully saved to disk ", tempFilePath);

                // handle the fiel to the gemini 
                console.log("Uplaoding to Google's Gemini....");

                // create teh gemini cleint
                const client = new GoogleGenAI({
                    apiKey: process.env.GEMINI_API_KEY,
                    requestOptions: { timeout: 600000 }
                })

                // upload now
                const uploadResult = await client.files.upload({
                    file: tempFilePath,
                    config: {
                        mimeType: 'video/mp4',
                        displayName: "S3 Video Analysis"
                    }
                })

                fs.unlinkSync(tempFilePath)

                // clean up the disk now 
                console.log("5.Cleaning up local temp file...");


                // the waiting game comes 
                let file = await client.files.get({ name: uploadResult.name })

                let retries = 0;
                let MAX_RETRIES = 30;

                while (file.state === "PROCESSING" && retries <= MAX_RETRIES) {
                    console.log(`...PROCESSING {Attempt ${retries + 1}/${MAX_RETRIES}} `);
                    console.log("....PROCESSING (waiting 2s)...");

                    await new Promise((resolve) => setTimeout(resolve, 2000))

                    file = await client.files.get({ name: uploadResult.name })

                    retries += 1
                }

                if (file.state === "FAILED") {
                    throw new Error("Gemini Processing Failed")
                }

                if (file.state === "PROCESSING") {
                    throw new Error("Gemini took too long, please try again")
                }

                console.log("Video Ready, Generating Content");

                // do the analysis now 
                const response = await client.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{
                        role: 'user',
                        parts: [
                            {
                                fileData: {
                                    fileUri: uploadResult.uri,
                                    mimeType: uploadResult.mimeType
                                }
                            },
                            {
                                // Safely inject their prompt into the JSON instructions!
                                text: `Analyze this video based on this prompt: "${prompt || 'Give me a summary of the whole video.'}".
                                Return ONLY a raw JSON object with two fields:
                                "title": A catchy, short title for the video based on the content (max 5 words).
                                "summary": The response to the prompt.
                                Do not include markdown formatting or backticks.`
                            }
                        ]
                    }]
                })


                console.log("Parsing Gemini JSON for Upload...");
                const cleanJson = response.text.replace(/```json/gi, '').replace(/```/gi, '').trim();
                const aiData = JSON.parse(cleanJson);

                // dave it to db
                const s3PublicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

                const newSession = await VideoSession.create({
                    userId: job.data.userId,
                    title: aiData.title,
                    sourceType: "UPLOAD",
                    videoUrl: s3PublicUrl,
                    geminiFileUri: uploadResult.uri
                })

                // create the message
                await Message.create({
                    sessionId: newSession._id,
                    role: 'ai',
                    text: aiData.summary
                })

                return {
                    sessionId: newSession._id.toString(),
                    playableUrl: s3PublicUrl,
                    fileData: {
                        uri: uploadResult.uri,
                        mimeType: uploadResult.mimeType
                    }
                }

            } catch (error) {
                throw error
            } finally {
                // clean up the file please
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath)
                }
            }

        }

        if (job.name === "process-instagram") {
            // all the isnta stuff 
            let tempFilePath = null
            const { instagramUrl } = job.data

            try {
                if (!instagramUrl) {
                    throw new Error("Instagram URL is missing")
                }

                // regex to find out the shortCode
                const regex = /\/(?:p|reel)\/([a-zA-Z0-9_-]+)/;

                // match the shortcode 
                const match = instagramUrl.match(regex)
                const shortcode = match ? match[1] : null

                if (!shortcode) {
                    throw new Error("Invalid Instagram URL format")
                }


                console.log("shortcode found in URL is", shortcode);

                console.log("1. Interogating RapidAPI for the raw mp4 link...");


                // rapid api url
                const rapidApiUrl = "https://instagram120.p.rapidapi.com/api/instagram/mediaByShortcode"


                // call the btich ass api
                // axios.post(URL, BODY, CONFIG_AND_HEADRES)
                const rapidApiResponse = await axios.post(
                    rapidApiUrl,
                    // send the shortcode in the body
                    {
                        shortcode: shortcode
                    },
                    {
                        headers: {
                            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                            'x-rapidapi-host': 'instagram120.p.rapidapi.com', // Tera RapidAPI host
                            'Content-Type': 'application/json'
                        },
                        timeout: 30000
                    }
                )

                console.log(rapidApiResponse);

                const data = rapidApiResponse.data

                if (!data || !data[0] || !data[0].urls || !data[0].urls[0] || !data[0].urls[0].url) {
                    throw new Error("RapidAPI betrayed us. No video URL found in the payload.")
                }

                // extract the url form the response sir 
                const rawVideoUrl = data[0].urls[0].url

                console.log("Raw URL from RapidAPI:", rawVideoUrl);

                // Dynamically determine if it's a video or image
                const isVideo = rawVideoUrl.includes('.mp4');
                let extension = '.webp';
                let mimeType = 'image/webp';

                if (isVideo) {
                    extension = '.mp4';
                    mimeType = 'video/mp4';
                } else if (rawVideoUrl.includes('.jpg') || rawVideoUrl.includes('.jpeg')) {
                    extension = '.jpg';
                    mimeType = 'image/jpeg';
                } else if (rawVideoUrl.includes('.png')) {
                    extension = '.png';
                    mimeType = 'image/png';
                }

                // generate temp path for our media
                tempFilePath = path.join(os.tmpdir(), `instagram-${Date.now()}${extension}`)


                console.log("2. Streaming the video directly to disk(Bypassing RAM)...");

                // tell the acios that we want to stream it
                const videoStreamResponse = await axios({
                    method: 'get',
                    url: rawVideoUrl,
                    responseType: 'stream',
                    timeout: 30000
                })

                // bypass the fking ram
                await pipeline(
                    videoStreamResponse.data,
                    fs.createWriteStream(tempFilePath)
                )


                console.log("3. File successfully staged on SSD:", tempFilePath);


                const s3Key = `uploads/${job.data.userId}/instagram/${Date.now()}${extension}`

                const command = new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: s3Key,
                    ContentType: mimeType,
                    Body: fs.createReadStream(tempFilePath)
                })

                await s3Client.send(command)

                console.log("S3 Smuggle Comepleted!!");

                // the gemini saga
                const client = new GoogleGenAI({
                    apiKey: process.env.GEMINI_API_KEY
                })

                // upload the fiel to gemini sir 
                const uploadResult = await client.files.upload({
                    file: tempFilePath,
                    config: {
                        mimeType: mimeType,
                        displayName: 'S3 Insta Post Analysis'
                    }
                })



                console.log("5. Uploaded to Gemini. Waiting for it to process..");

                // polling the loooppppp 
                let file = await client.files.get({ name: uploadResult.name })

                // start the polling mfk 
                let retries = 0;
                let MAX_RETRIES = 30;

                while (file.state === "PROCESSING" && retries < MAX_RETRIES) {
                    console.log(`...PROCESSING {Attempt ${retries + 1}/${MAX_RETRIES}} `);
                    await new Promise((resolve) => setTimeout(resolve, 3000))
                    file = await client.files.get({ name: uploadResult.name })

                    retries++
                }

                if (file.state === "FAILED") {
                    throw new Error("Gemini processing failed.")
                }

                // check if its failed or not 
                if (file.state === "PROCESSING") {
                    throw new Error("Gemini processing failed. The video might be corrupted.")
                }

                console.log("6. Video Ready. Asking Gemini for a summary...");

                const response = await client.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: [{
                        role: 'user',
                        parts: [
                            {
                                fileData: {
                                    fileUri: uploadResult.uri,
                                    mimeType: uploadResult.mimeType
                                }
                            },
                            {
                                text: `Analyze this Instagram post and return ONLY a raw JSON object with two fields:
                        "title": A catchy, short title for the post (max 5 words).
                        "summary": A 3-line summary of what happens in the post.
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


                // save the sesion to mongoDB
                const newSession = await VideoSession.create({
                    userId: job.data.userId,
                    title: aiData.title,
                    sourceType: 'INSTAGRAM',
                    videoUrl: s3PublicUrl,
                    geminiFileUri: uploadResult.uri
                })

                // save the message
                await Message.create({

                    sessionId: newSession._id,
                    role: 'ai',
                    text: aiData.summary

                })

                // the job.returnvalue which polling gonna be needing
                return {
                    sessionId: newSession._id.toString(),
                    playableUrl: s3PublicUrl,
                    fileData: {
                        uri: uploadResult.uri,
                        mimeType: uploadResult.mimeType
                    }
                }


            } catch (error) {
                throw error
            } finally {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath)
                }
            }
        }
    },
    {
        connection,
        concurrency: 1,      //ram prices dekhke hain bc?????
        lockDuration: 300000 // 5 minutes to prevent Gemini API from stalling the job
    }

)