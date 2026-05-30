import React from 'react'
import { useState, useCallback, useMemo} from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Clock, MessageCircle, Archive } from 'lucide-react';

export const UploadScreen = () => {

  // this will rememebr which file has been uploaded
  const [file, setFile] = useState(null)

  // state for loader
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [videoLink, setVideoLink] = useState('')

  const navigate = useNavigate()

  const videoUrl = useMemo(() => {
    if(file) return URL.createObjectURL(file)
    return null
  }, [file])

  // get the token sirrr
  const token = useAuthStore((state) => state.token)

  // handleAnalyze funtion for
  const handleAnalyze = async () => {

    // if file aint there then go back 
    if(!file) return toast.error("Please drop a video first");
    
    if(!token) {
      toast("Please log in or create an account to analyze videos")
      navigate('/login')
      // stop the fucntion from runninx axios and all 
      return
    }

    // now turn the laoding statte true coz ab laoding ka kaam actually hona hai 
    setIsAnalyzing(true);
    toast.loading("Step 1: Generating VIP Pass...", {id: "upload-toast"})

    try {

      // get the token from localstorage pleasee
      const token = localStorage.getItem('paganini_token')

      // find the auth headers
      const authHeaders = {
        Authorization:`Bearer ${token}` 
      }

      // ask backend for the presigned url
      const urlResponse = await axios.post(
        'http://localhost:3000/api/ai/upload-url',
        {
          fileName: file.name, 
          fileType: file.type
        },
        {
          headers: authHeaders
        }
      )
      // when you'll get response from backend toh happy
      console.log("Got response from Backend!!!", urlResponse.data)

      // quitie interesting tbh
      const {url: s3UploadUrl , key: s3Key } = urlResponse.data

      // step 2: uplaod directly to S3 (Bypassing the nodeJS Backned)
      toast.loading("Step 2/3: Uploading to Amazon S3...", { id: "upload" })
      await axios.put(s3UploadUrl, file, {
        headers: {
          'Content-Type': file.type
        }
      })


      // STEP 3 : Tell the backend to analyze the S3 file
      toast.loading("Step 3/3: Gemini is Analyzing...", { id: "upload" });
      const analysisResponse = await axios.post(
        'http://localhost:3000/api/ai/process-s3',
        {
          s3Key: s3Key,
          prompt: "Give me a 3 line summary of the whole video."
        },
        {
          headers: authHeaders
        }
      )

      toast.success("Analysis Complete!" , {
        id: 'upload'
      })

      // teleport to tha analysis screeen
      navigate('/analysis', {
        state: {
          file: file,
          initialData: analysisResponse.data
        }
      })

    } catch (error) {
      console.log("Upload Failed", error)
      toast("Failed to process video.", { id: "upload" })
    } finally {
      // laoding ko wapis false kardo taki data dikhe in either case
      setIsAnalyzing(false)
    }
  }
  
  const handleLinkAnalyze = async () => {

    // check if vieolink is actually there or not
    if(!videoLink.trim()) return;

    if(!token) {
      toast("Please log in or create an account to analyze links")
      navigate('/login')
      // to stop the excustion of axios
      return
    }

    setIsAnalyzing(true)
    try {

      // 1. grab the tooken from making request from local storage
      const token = localStorage.getItem('paganini_token')

      // now we send normla json data here 
      const response = await axios.post(
        'http://localhost:3000/api/ai/analyze-url',
        {videoLink: videoLink}, // the body so basically 2nd arguemtn
        {
          headers: {
            Authorization: `Bearer ${token}`  // 3rd arg is our headers
          }
        }
      );
      
      console.log("Link Analysis Response:", response.data)

      // now pass the data to app.jsx
      navigate('/analysis', {state: {
        file: null, initialData: response.data
      } })

    } catch (error) {
      
      console.log("Error analyzing link:", error)

      toast("Failed to analyze link. Check the console.")

    } finally {
      setIsAnalyzing(false)
    }

  }

  // my onDrop function:- its main task is to get the file and save it to "file" state
  const onDrop = useCallback((acceptedFiles) => {
    
    
    if(!token) {
      toast("Please log in or create an account to upload and analyze videos")
      navigate('/login')
      return
    }

    // else if the got token then let them do whatever the fk they want
    // get the first fking file from the acceptedFIles 
    const droppedFile = acceptedFiles[0]
    console.log("We got the File!!!", droppedFile)

    // save this file inside....basically container me daaldo my lad!!!
    setFile(droppedFile)
  }, [token, navigate])

  // we will give useDropzone to our onDrop to run 
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
    // whever ondrop recevie file then what we gotta do with it 
    onDrop,
    // which files to allow
    accept: { 'video/*': [] },
    maxFiles: 1
  })


  return (
    <div className='relative w-full min-h-screen flex flex-col items-center  overflow-y-auto no-scrollbar py-20 '>

            {/* Ye rahe tere Background Glows (Inse Glass effect zinda hoga) */}
      <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* <div className="absolute top-[30%] w-[400px] h-[400px] bg-red-200/30 rounded-full blur-[120px] pointer-events-none "/> */}

      <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    {/* wrapper is needed sir  */}
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh] ">

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
      
    </div>




        {/* test it mfk  */}
        {file && (
          <div className="mt-4 text-sm text-green-400">File Selected: {file.name} </div>
        )}

        {/* featuer ig */}
        <section className="w-full max-w-6xl mx-auto px-6 mt-32 flex flex-col items-center">
          {/* header kinda thing we'll see it  */}
          <div className=" flex flex-col items-center text-center mb-16">
            {/* label */}
            <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-2">
              Features
            </span>

            {/* the main title */}
            <h2 className="text-3xl md:text-4xl font-semibold text-white/90 mb-4">
              Powerful Video Intelligence
            </h2>

            {/* the subititle  */}
            <p className="text-neutral-400 max-w-2xl">
              Paganini uses AI to uncover what matters most in your videos.
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative">

            {/* glowing stuff */}
            <div className="absolute -left-20 top-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[101px] pointer-events-none " />

            {/* glowing stuff */}
            <div className="absolute left-100 top-9 w-72 h-72 bg-neutral-100/20 rounded-full  blur-[101px] pointer-events-none " />

            {/* glowing stuff */}
            <div className="absolute -right-20 bottom-8 w-72 h-72 bg-purple-500/20 rounded-full blur-[101px] pointer-events-none " />
            
            {/* feature card 1  */}
            <div className="h-64 border border-white/10 rounded-2xl bg-neutral-950/50 p-8 flex flex-col justify-start  backdrop-blur-xl relative overflow-hidden z-10">

              {/* icon wrapper */}
              <div className="w-10 h-10 border rounded-full border-white/10 bg-neutral-900 flex items-center justify-center mb-6 ">
                
                {/* smthgn stupdi */}
                <Clock className="w-4 h-4 text-blue-400/40" />
              </div>

              {/* card title */}
              <h3 className="text-lg font-semibold text-white mb-2">
                Ai Timestamps
              </h3>

              {/* card description */}
              <p className="text-sm text-neutral-400 leading-relaxed">
                  Automatically detect key moments and jump straight to what matters.
              </p>
            </div>


            {/* feature card 2  */}
            <div className="h-64 border border-white/10 rounded-2xl bg-neutral-950/50 p-8 flex flex-col justify-start backdrop-blur-xl relative overflow-hidden z-10 ">

              {/* icon wrapper */}
              <div className="w-10 h-10 border rounded-full border-white/10 bg-neutral-900 flex items-center justify-center mb-6 ">
                
                {/* smthgn stupdi */}
                <MessageCircle className="w-4 h-4 text-purple-400/40" />

              </div>

              {/* card title */}
              <h3 className="text-lg font-semibold text-white mb-2">
                Semantic Search.
              </h3>

              {/* card description */}
              <p className="text-sm text-neutral-400 leading-relaxed">
                  Find anything in your videos using natural language queries
              </p>
            </div>


            {/* feature card 3  */}
            <div className="h-64 border border-white/10 rounded-2xl bg-neutral-950/50 p-8 flex flex-col justify-start backdrop-blur-xl relative overflow-hidden z-10 ">

              {/* icon wrapper */}
              <div className="w-10 h-10 border rounded-full border-white/10 bg-neutral-900 flex items-center justify-center mb-6 ">
                
                {/* smthgn stupdi */}
                  <Archive className="w-4 h-4 text-emerald-400/40" />

              </div>

              {/* card title */}
              <h3 className="text-lg font-semibold text-white mb-2">
                The Vault
              </h3>

              {/* card description */}
              <p className="text-sm text-neutral-400 leading-relaxed">
                Securely store, organize, and revisit your video insights anytime.
              </p>
            </div>



          </div>
        </section>

        {/* HOW IT WORKSSSSS sir section */}
        <section className="w-full max-w-6xl mx-auto px-6 mt-40 mb-32 flex flex-col items-center">
          {/* the headerrrr */}
          <div className="flex flex-col items-center text-center mb-20 ">
            {/* chotu */}
            <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-2">
              How It Works
            </span>

            <h2 className="text-3xl md:text-4xl font-semibold text-white/90">
              From Video to Insights in 3 Simple Steps
            </h2>
          </div>

          {/* the time line steps */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 relative z-10  ">
              {/* the np. badge */}
              <div className="shrink-0 w-16 h-16 rounded-full border border-white/10 bg-neutral-950 flex items-center justify-center text-2xl font-bold text-neutral-400/20 ">
              1
              </div>

              {/* the text thing */}
              <div className="">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Upload or Paste Link
                </h3>

                <p className="text-sm text-neutral-400 leading-relaxed">
                  Upload your video file or paste a YouTube or Instagram link.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 relative z-10">
              <div className="shrink-0 w-16 h-16 rounded-full border border-white/10 bg-neutral-950 flex items-center justify-center text-2xl font-bold text-neutral-400/20">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Extracts Context</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Our AI analyzes your video and extracts key insights and timestamps.
                </p>
              </div>
            </div>

                    {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 relative z-10">
              <div className="shrink-0 w-16 h-16 rounded-full border border-white/10 bg-neutral-950 flex items-center justify-center text-2xl font-bold text-purple-400/20">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Chat & Analyze</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Ask questions, explore insights, and get answers in real-time.
                </p>
              </div>
            </div>

          </div>
        </section>
 
    </div>
  )
}