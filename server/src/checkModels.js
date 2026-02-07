import { GoogleGenAI } from '@google/genai'
import dotenv from 'dotenv'

dotenv.config()

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const models = await client.models.list()
for await (const model of models) {
    console.log(model.name, '-', model.supportedGenerationMethods)
}