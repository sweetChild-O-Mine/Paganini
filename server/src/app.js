import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import aiRoutes from './routes/aiRoutes.js'
import path from 'path'
import { fileURLToPath } from 'url'


// recreate __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()

// use the mfkin middlewares 
app.use(cors())
app.use(express.json())

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/ai', aiRoutes)

// creating a test route
app.get('/', (req, res) => [
    res.send('Maestro engine is running!!!')
])

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`We are listening you...on port ${PORT} mr.mfker!!!`))