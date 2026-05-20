import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required. We arent doing anonymous burners here."],
            trim: true
        },
        email: {
            type: String,
            required: [true, "Email is required."],
            unique: true,
            lowercase: true
        },
        password: {
            type: String, 
            required: [true, "Password is required"],
            // bcrypt hash reminder
        }
    },
    {
        // autometically adds createAt and upadatedAd filelds to every user.
        timestamps: true
    }
)

// export the compiled Model. 'User' will becomes the collection 'users' in MongoDB
export const User = mongoose.model('User', userSchema)