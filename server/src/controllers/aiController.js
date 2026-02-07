import {GoogleGenAI} from '@google/genai'
import fs from 'fs'
import dotenv, { config } from 'dotenv'

dotenv.config()

// initialize the new client 

const analyzeVideo = async (req, res) => {

    try {

        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })


        if(!req.file) {
            res.status(400).json({error: "File is missing!!!....just like her feelings for yaaa!!!!"})
        }

        // if the file is still there that means multer does it job nicely
        console.log("1. File saved at: ",req.file.path);

        // new SDK stuff
        const uploadResult = await client.files.upload({
            file: req.file.path,
            config: {
                mimeType: 'video/mp4',
                displayName: req.file.filename
            }
        })

        console.log("2. Uploaded to Gemini: URI",uploadResult.uri );

        // wait for video processign 
        let file = await client.files.get({name: uploadResult.name})

        while(file.state === "PROCESSING") {
            console.log("....PROCESSING (waiting 2s)...");
            await new Promise((resolve) => setTimeout(resolve, 2000))
            file = await client.files.get({name: uploadResult.name})
        }

        if(file.state === "FAILED") {
            throw new Error("Video processing failed.")
        }

        console.log("3. Video Ready. Generating Content...");

        // 3. Generate Content (Chat)
        const respone = await client.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: [
                {
                    role: 'user',
                    parts: [
                        {fileData: {fileUri: uploadResult.uri, mimeType: uploadResult.mimeType}},
                        { text: "Analyze this video. Give me a title and 3 key timestamps." }
                    ]
                }
            ]
        })

        // send response 
        console.log("4. successs!!!");
        
        // nice respone for them ig 
        res.status(200).json({
            message: "Success!!",
            analysis: respone.text()
        })
        // clean up the local file
        fs.unlinkSync(req.file.path)
        
    } catch (error) {
        console.log("We got error in aiController:", error);
        res.status(500).json({
            error: error.message
        })
    }
};

// export this thing pweeeeasee
export { analyzeVideo }