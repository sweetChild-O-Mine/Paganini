import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'

dotenv.config()

console.log("API Key (first 10 chars):", process.env.GEMINI_API_KEY?.slice(0, 10) + "...")

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const response = await client.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: 'Say hello'
})

console.log("Response:", response.text())