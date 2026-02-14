// handle the dirty and heavy stuff fr 
import ffmpeg from 'fluent-ffmpeg'
import fs, { stat } from 'fs'
import path from 'path'
import { Upload } from '@aws-sdk/lib-storage'
import { S3, S3Client } from '@aws-sdk/client-s3'

import dotenv from 'dotenv'
dotenv.config()


// initialize the aws client mr. mfk
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})


// compress the mfkin video nowwwwww
const compressVideo = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        console.log("Our Butcher started working", inputPath);

        ffmpeg(inputPath)
            .outputOptions([
                '-vf', 'scale=854:-2',
                '-c:v', 'libx264',
                '-crf', '28',
                '-preset', 'fast',
                '-c:a', 'aac',
                '-b:a', '64k', 
                '-threads', '0'      
            ])
            .on('progress', (progress) => {
                const percent = Math.round(progress.percent || 0)
                if (percent % 10 === 0) {
                    console.log(`....Compressing: ${percent}%....`);
                }
            })
            .on('end', () => {
                console.log('Compression Complete: ', outputPath);
                resolve(outputPath)
            })
            .on('error', (err) => {
                console.log('FFmpeg Failed :/', err.message);
                reject(err)
            })
            .save(outputPath)
    })
}


// now take the compreesed file and upload it to S3

const uploadToS3 = async (filePath, filename) => {
    const fileStream = fs.createReadStream(filePath)

    console.log("Uploading to S3...");

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: filename,
            Body: fileStream,
            ContentType: "video/mp4"
        }
    })

    await upload.done()

    // construct the url using your own fingers mfk 
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`

    console.log("...Public URL Generated sir!!!....", url);

    // return the mfing url 
    return url
}

//  THE MFKIN MANAGER 
// the main fucntion which will control almost everything : process and upload
export const processAndUpload = async (originalPath, originalFilename) => {
    try {

        // chekc the file size broo please
        const stats = fs.statSync(originalPath)
        const fileSizeMB = stats.size / (1024*1024)
        console.log(`📏 File Size: ${fileSizeMB.toFixed(2)} MB`);

        let pathForS3 = originalPath
        let pathForGemini = originalPath
        let s3Filename = `raw-${Date.now()}-${originalFilename}`
        let compressedPath = null

        const COMPRESSION_THRESHOLD_MB = 1500

        // the decision gate now 
        if(fileSizeMB > COMPRESSION_THRESHOLD_MB) {
            console.log(`File > ${COMPRESSION_THRESHOLD_MB}MB. Switching to COMPRESSION MODE`);  

            
            // 1. first we need to define the paths
            const compressedFilename = `compressed-${Date.now()}.mp4`
            compressedPath = path.join('uploads', compressedFilename)
    
            //  now call the butcher and compress the shit out of this mfkin video
            await compressVideo (originalPath, compressedPath)

            // s3 gets compressed
            pathForS3 = compressedPath
            s3Filename = compressedFilename

            // gemini also gets comporessed file 
            pathForGemini = compressedPath

        } else {
            console.log(`File < ${COMPRESSION_THRESHOLD_MB}MB. Switching to BYPASS Mode (Direct Upload).`);  

        }


        // now upload to s3
        const s3Url = await uploadToS3(pathForS3, s3Filename, "video/mp4" )

        return {
            s3Url,
            pathForGemini,
            compressedPath,
            wasCompressed : fileSizeMB > COMPRESSION_THRESHOLD_MB
        }

    } catch (error) {
        console.log("Video Processing Failed!!!", error);   
        throw error
    }
}
