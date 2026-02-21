// handle the dirty and heavy stuff fr 
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()



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


//  THE MFKIN MANAGER 
// the main fucntion which will control almost everything : process and upload
export const processAndUpload = async (originalPath, originalFilename) => {
    try {

        // chekc the file size broo please
        const stats = fs.statSync(originalPath)
        const fileSizeMB = stats.size / (1024*1024)
        console.log(`📏 File Size: ${fileSizeMB.toFixed(2)} MB`);

        let pathForGemini = originalPath
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


            // gemini also gets comporessed file 
            pathForGemini = compressedPath

        } else {
            console.log(`File < ${COMPRESSION_THRESHOLD_MB}MB. Switching to BYPASS Mode (Direct Upload).`);  

        }

        return {
            pathForGemini,
            compressedPath,
            wasCompressed : fileSizeMB > COMPRESSION_THRESHOLD_MB
        }

    } catch (error) {
        console.log("Video Processing Failed!!!", error);   
        throw error
    }
}
