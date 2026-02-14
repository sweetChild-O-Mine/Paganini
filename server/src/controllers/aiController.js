import {GoogleGenAI} from '@google/genai'
import fs from 'fs'
import dotenv from 'dotenv'
import { processAndUpload } from '../services/videoProcessor.js'

dotenv.config()

// initialize the new client 

const analyzeVideo = async (req, res) => {

    // orihianl file trackers 
    let originalPath = null
    let compressedPath = null

    try {

        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })


        if(!req.file) {
            return res.status(400).json({error: "File is missing!!!....just like her feelings for yaaa!!!!"})
        }

        originalPath = req.file.path
        // if the file is still there that means multer does it job nicely
        console.log("1. File received: ", originalPath);

        // start the process and upload to s3
        console.log("...Starting s3 pipeline...");
        const result = await processAndUpload(originalPath, req.file.filename)

        const { s3Url, pathForGemini, wasCompressed } = result

        compressedPath = result.compressedPath

        console.log("S# url:", s3Url);
        console.log("Will send to Gemini:", pathForGemini);
        console.log("was compressed", wasCompressed);

        // Uplaod to gemini 
        console.log("...Uploading to Gemini...");

        const uploadResult = await client.files.upload({
            file: pathForGemini,
            config: {
                mimeType: 'video/mp4',
                displayName: req.file.filename
            }
        })

        console.log("2. Uploaded to Gemini: Gemini URI",uploadResult.uri );

        // wait for gemini to procees the stuff
        let file = await client.files.get({name: uploadResult.name})

        while(file.state === "PROCESSING") {
            console.log("....PROCESSING (waiting 2s)...");
            await new Promise((resolve) => setTimeout(resolve, 2000))
            file = await client.files.get({name: uploadResult.name})
        }

        if(file.state === "FAILED") {
            throw new Error("Gemini processing failed. Even AI needs a coffee break sometimes.")
        }

        console.log("3. Video Ready. Generating Content...");

        // gneerate analysis with LOW media resolution
        console.log("Analyzing with mediaResolution: 'low'...");

        // 3. Generate Content (Chat)
        const respone = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                // so that it will eat less tokens 
                mediaResolution: 'low'
            },
            contents: [
                {
                    role: 'user',
                    parts: [
                        {fileData: {fileUri: uploadResult.uri, mimeType: uploadResult.mimeType}},
                        { text: "Analyze this video. Give me a title and 5 key timestamps." }
                    ]
                }
            ]
        })

        // send response 
        console.log("4. successs!!!");

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
        
        // nice respone for them ig 
        res.status(200).json({
            message: "Success!!",
            videoUrl : s3Url,
            wasCompressed,
            analysis: respone.text
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

// export this thing pweeeeasee
export { analyzeVideo }