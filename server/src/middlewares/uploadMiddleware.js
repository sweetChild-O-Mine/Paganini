const multer = require('multer')
const path = require('path')
const fs = require('fs')

/* 
myy current file is in: server/src/middlewares/

me want to reach: server/uploads/

basically ../../uploads is actually how you go from middlewares to uploads
*/

const uploadDir = path.join(__dirname, "../../uploads")

if(!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    })
}

// storage engine :- configured to store files on the local file system.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        const uniqueName = 'video-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)
        cb(null, uniqueName)
    }
})


const upload = multer({
    storage: storage
})

module.exports = upload