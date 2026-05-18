import mongoose from "mongoose";

const videoSessionSchema = new mongoose.Schema(
    {
        // user id it baiscally binds the session to a specific user in user collection 
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', //this tells mongoose: that this id belongs to the User model
            required: [true, "A session MUST belong to a user. No orphans allowed."]
        },
        title: {
            type: String,
            default: "New Analysis"
        },
        sourceType: {
            type: String,
            enum: ['UPLOAD', 'YOUTUBE'], //enums basically means it cant be anything else other than what we mentioned
            required: true
        },
        videoUrl: {
            // youtube link or s3/local file path
            type: String
        },
        geminiFileUri: {
            type: String,
            // it basically saves the uri so that we can use that uri to chat with the video later
            required: [true, "Gemini URI is required"]
        }

    },
    {
        timestamps: true
    }
)

export const VideoSession = mongoose.model('VideoSession',videoSessionSchema )