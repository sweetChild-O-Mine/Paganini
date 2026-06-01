import {S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

// load the env file before we tryt o read the keys mfk 
dotenv.config()

// 1. create new instace of S3 Client 
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

export { s3Client }