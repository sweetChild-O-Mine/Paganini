import { Worker } from "bullmq";
import { connection } from "../config/redisConnection.js";
import {VideoSession} from '../models/VideoSession.js'
import os from 'os'
import { s3Client } from '../config/awsConfig.js'
import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs'
import { GoogleGenAI } from "@google/genai";
import { Message } from "../models/Message.js";
import path from "path";
import dotenv from 'dotenv'
import connectDB from '../config/db.js'

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
            const tempFilePath = path.join(os.tmpdir(),`paganini-${Date.now()}mp4`)

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
                const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY,
                    requestOptions : { timeout: 600000 }
                 })
    
                // upload now
                const uploadResult = await client.files.upload({
                    file: tempFilePath,
                    config: {
                        mimeType: 'video/mp4' ,
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
    
                while(file.state === "PROCESSING" && retries <= MAX_RETRIES) {
                console.log(`...PROCESSING {Attempt ${retries + 1}/${MAX_RETRIES}} `);
                console.log("....PROCESSING (waiting 2s)...");
    
                await new Promise((resolve) => setTimeout(resolve, 2000))
    
                file = await client.files.get({name: uploadResult.name})
                
                retries += 1
                }
    
                if(file.state === "FAILED") {
                    throw new Error("Gemini Processing Failed")
                }
                
                if(file.state === "PROCESSING") {
                    throw new Error("Gemini took too long, please try again")
                }
    
                console.log("Video Ready, Generating Content");
    
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
                const s3PublicUrl =  `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`
    
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
        }
    },
    {
        connection,
        concurrency: 1      //ram prices dekhke hain bc?????
    }

)