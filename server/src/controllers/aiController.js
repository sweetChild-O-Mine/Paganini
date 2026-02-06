const analyzeVideo = async (req, res) => {

    try {
        if(!req.file) {
            res.status(400).json({error: "File is missing!!!....just like her feelings for yaaa!!!!"})
        }

        // if the file is still there that means multer does it job nicely
        console.log("File saved at: ",req.file.path);

        // nice respone for them ig 
        res.status(200).json({
            message: "Video uploaded successfullyy!!",
            filePath: req.file.path,
            filename: req.file.filename
        })
        
    } catch (error) {
        console.log("We got error in aiController:", error);
        res.status(500).json({
            error: "Server crashed while processing video!!!"
        })
    }
    
}

// export this thing pweeeeasee
module.exports = {analyzeVideo}