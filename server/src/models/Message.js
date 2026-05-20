import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        // time to bindn the message to a speficic video sessions and we know that video sessoin is already binded with user
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VideoSession',
            required: true
        },
        role: {
            type: String,
            enum: ['user', 'ai'],  //onnly these two mfk are allowed no hackers are allowed btw sirrrrr!!!!
            required: true
        },
        text: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

export const Message = mongoose.model('Message', messageSchema)