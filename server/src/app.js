const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const aiRoutes = require('./routes/aiRoutes')

// use the mfkin middlewares 
app.use(cors())
app.use(express.json())

app.use('/api/ai', aiRoutes)

// creating a test route
app.get('/', (req, res) => [
    res.send('Maestro engine is running!!!')
])

app.listen(3000, () => console.log("We are listening you...on port 3000 mr.mfker!!!"))