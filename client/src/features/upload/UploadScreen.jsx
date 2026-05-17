import React from 'react'
import { useState, useCallback, useMemo} from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'


export const UploadScreen = ({onAnalysisComplete}) => {

  // this will rememebr which file has been uploaded
  const [file, setFile] = useState(null)

  // state for loader
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [videoLink, setVideoLink] = useState('')

  const videoUrl = useMemo(() => {
    if(file) return URL.createObjectURL(file)
    return null
  }, [file])

  // handleAnalyze funtion for
  const handleAnalyze = async () => {

    // if file aint there then go back 
    if(!file) return;

    // now turn the laoding statte true coz ab laoding ka kaam actually hona hai 
    setIsAnalyzing(true)

    try {
      // make formdata "parsal" for our api 
      const formData = new FormData()

      // now we will keep the key as 'video' coz in the multer we wrote it as thats why 
      formData.append('video', file)

      // now send POST request to backend using Axios
      const response = await axios.post('http://localhost:3000/api/ai/analyze', formData, {
        headers: {
          // tell the backend ki what the fuck are we actually sending...basically its not json biaatchhh
          'Content-Type': 'multipart/form-data'
        }
      });

      // when you'll get response from backend toh happy
      console.log("Got response from Backend!!!", response.data)

      const analysis = response.data.analysis
      console.log(analysis)

      // run this anaylists thing
      onAnalysisComplete(file, response.data)

    } catch (error) {
      console.log("There's some ERROR in API", error)
      alert('Upload failed. Is server running?')
    } finally {
      // laoding ko wapis false kardo taki data dikhe in either case
      setIsAnalyzing(false)
    }


  }
  
  const handleLinkAnalyze = async () => {

    // check if vieolink is actually there or not
    if(!videoLink.trim()) return;

    setIsAnalyzing(true)
    try {
      // now we send normla json data here 
      const response = await axios.post('http://localhost:3000/api/ai/analyze-url', {
        videoLink: videoLink
      });
      
      console.log("Link Analysis Response:", response.data)

      // now pass the data to app.jsx
      onAnalysisComplete(null, response.data)


    } catch (error) {
      
      console.log("Error analyzing link:", error)

      alert("Failed to analyze link. Check the console.")

    } finally {
      setIsAnalyzing(false)
    }

  }

  // my onDrop function:- its main task is to get the file and save it to "file" state
  const onDrop = useCallback((acceptedFiles) => {

    // get the first fking file from the acceptedFIles 
    const droppedFile = acceptedFiles[0]
    console.log("We got the File!!!", droppedFile)

    // save this file inside....basically container me daaldo my lad!!!
    setFile(droppedFile)
  }, [])

  // we will give useDropzone to our onDrop to run 
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
    // whever ondrop recevie file then what we gotta do with it 
    onDrop,
    // which files to allow
    accept: { 'video/*': [] },
    maxFiles: 1
  })


  return (
    <div className='relative w-full h-full flex flex-col items-center justify-center overflow-y-auto no-scrollbar py-20  '>

            {/* Ye rahe tere Background Glows (Inse Glass effect zinda hoga) */}
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* <div className="absolute top-[30%] w-[400px] h-[400px] bg-red-200/30 rounded-full blur-[120px] pointer-events-none "/> */}

      <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* main hero section text */}
      <div className="relative z-10 text-center mb-12 mt-10 ">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-linear-to-r from-neutral-100 to-neutral-500 prata-regular py-2 ">
          Analyze your video with AI
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto">
          Upload any video and let Paganini uncover its secrets, generate insights, and answer your questions in real-time.
        </p>
      </div>

      <div className="relative z-10 overflow-hidden w-full max-w-3xl bg-neutral-950/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8  shadow-[0_0_50px_rgba(0,0,0,0.5)]">

          {/* checck if file state me actualy koi file hai bhi ya nahi...if it izz there then show the video player and if its not then just show the dropzone */}
          {file ? (
            <div className="w-full flex flex-col items-center justify-center mt-10 space-y-4">

              {/*put the video player of html sir   */}
              <video
                className="w-full max-w-2xl rounded-xl border border-neutral-700 shadow-lg"
                controls
                autoPlay
                // the BLOB url
                src={videoUrl}
              />

              {/* button to remove the wrong video if tis been uplaoded by mistake */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setFile(null)}
                  variant='destructive'
                  className='px-6 py-6 bg-red-500/20 text-red-50 text-lg rounded-lg transition cursor-pointer'
                >
                  Remove
                </Button>
                <Button
                  onClick={handleAnalyze} 
                  className="px-6 py-6 bg-neutral-700 hover:bg-neutral-800 text-lg rounded-lg transition font-bold cursor-pointer">
                    {isAnalyzing ? 'Analyzing...' : 'Analyze with Gemini!!' }
                </Button>

              </div>

            </div>
          ) : (
            
            // new wrapper here 
            <div className="w-full flex flex-col">

              {/*               // if file aint there then show the fking dropzone
              // DROPZONE are it izzzzz */}


              <div
                {...getRootProps()}
                className={`border-2 border-dotted border-gray-600 rounded-2xl h-[300px] flex flex-col items-center justify-center cursor-pointer transition-all p-4 duration-300
                ${isDragActive ? 'border-white/40 bg-white/10' : 'border-neutral-700 hover:border-neutral-500 hover:bg-neutral-600/5'}
                `}>

                {/* put this getInputProps on this invisble input thing */}
                <input {...getInputProps()} />
                {/* if some nigga's trying to drag then change the text please */}

                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-6 shadow-lg border border-white/5 ">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLineJoin="round" className="text-neutral-500">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg> 
                </div>

                {/* cutsom textss */}
                {isDragActive ? (
                  <p className='text-2xl text-white/30 font-medium '> Drop the video here... </p>
                ) : (
                    <div className="text-center">
                    
                      <p className='text-xl text-neutral-400 font-semibold mb-2'>Click or drag video to upload</p>

                      <p className="text-sm text-neutral-500">
                        MP4, WebM, or OGG up to 2GB
                      </p>

                    </div>

                )}
              </div>

              {/* new link input from here */}
              <div className="w-full mt-6 py-4">
                {/* Divider kindathing */}
                <div className="relative flex items-center py-4">
                  <div className="grow border-t border-neutral-700/50" />
                  <span className="flex shrink-0 mx-4 text-neutral-500 text-sm font-medium ">
                    OR PASTE A LINK
                  </span>
                  <div className="grow border-t border-neutral-700/50"/>
                </div>

                {/* main input box  */}
                <div className="flex gap-3 mt-2">
                  <input
                   type="url"
                   placeholder='Paste YouTube or Instagram link here...'
                   className="flex-1 bg-white/5 border border-white/10 text-white/95 rounded-xl h-12 px-4 focus-visible:ring-1 focus-visible:ring-neutral-900 text-base"
                   value={videoLink}
                   onChange={(e) => setVideoLink(e.target.value)}
                   />

                  <Button 
                      className="h-12 px-6 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] cursor-pointer"
                      onClick={handleLinkAnalyze}
                      disabled={isAnalyzing}
                  >
                      {isAnalyzing ? "Analyzing...": "Analyze Link"}
                  </Button>

                </div>
                  
              </div>

            </div>
          )}

      </div>




        {/* test it mfk  */}
        {file && (
          <div className="mt-4 text-sm text-green-400">File Selected: {file.name} </div>
        )}
 
    </div>
  )
}