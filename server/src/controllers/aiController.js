import {GoogleGenAI} from '@google/genai'
import fs from 'fs'
import dotenv from 'dotenv'
import { processAndUpload } from '../services/videoProcessor.js'

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
        
        // nice response for them ig 
        res.status(200).json({
            message: "Success!!",
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
        const {prompt, fileData} = req.body;

        if(!fileData || !fileData.uri) {
            return res.status(400).json({
                error: "URI not found "
            })
        }

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

        res.status(200).json({
            reply: response.text
        })


    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Gemini crashed. Probably because of your prompt." });
    }
}

// export this thing pweeeeasee
export { analyzeVideo, chatWithVideo}