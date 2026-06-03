import React, { useState, useMemo, useEffect, useEffectEvent} from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ReactMarkdown from 'react-markdown';
import ReactPlayer from 'react-player'
import { useLocation, useNavigate } from 'react-router-dom';


// managaer has sent someth that's why employee willrecienve it and he's doing it
export const AnalysisScreen = () => {

    // get the data
    const location = useLocation()
    const navigate = useNavigate()


    // bouncer to coz if user types mannualy localhost:smth/analysis then to kick them back to home page
    useEffect(() => {
        if(!location.state) {
            navigate('/')
        }
    }, [location, navigate])

    // when the bouncer is kiccking that mfk out dont try to load the rest of the page
    if(!location.state) {
        return null
    }

    // get the teleported data
    const {file, initialData} = location.state

    const [messages, setMessages] = useState([
        { role : 'ai', text: initialData?.analysis }
    ])

    const [input, setInput] = useState('')
    // when gemini doing analysis and trying to generate the response toh us time there must be smth to show
    const [isTyping, setIsTyping] = useState(false)

    useEffect(() => {
        const fetchHistory = async () => {
            // check if you got sesisonId or not...if u dont have then do nothing coz for the first page load we dont have sessinId
            if(!initialData?.sessionId) return

            try {
                //1. get the wristBand the mfking JWT
                const token = localStorage.getItem('paganini_token')

                // 2. assl the backend for the history now 
                const response = await axios.get(
                    `http://localhost:3000/api/ai/session/${initialData.sessionId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                // 3. backend will return the arr of messages now 
                const dbMessages = response.data.messages

                // if mongo got the memssages saved we will overrdie ther reacr states...
                if(dbMessages && dbMessages.length > 0) {
                    // map over it and make sure theyy match the ui for of our ui 
                    const formattedMessages = dbMessages.map((msg) => ({
                        role: msg.role,
                        text: msg.text
                    }))
                    // now replace the default single message state witht he full db history 
                    setMessages(formattedMessages)
                }

            } catch (error) {
                console.error("Failed to fetch chat history:", error)
            }
        }

        // call the fucntiono please 
        fetchHistory()
        // only runs this useeffect whenever there's a change in sessionId
    }, [initialData?.sessionId])

    // this well tell the react ki is URL ko ek baar banao sirf....when file is uplaoded...dont make it again and again
    const videoUrl = useMemo(() => {
        // if its from drag and drop stuff then play it from the browser
        if (file) return URL.createObjectURL(file)

        // if its from insta video from our bakcend , play the s3 URL
        if (initialData?.playableUrl) return initialData.playableUrl

        // if its from yt...play the yt url mfk
        if (initialData?.fileData?.uri) return initialData.fileData.uri

        return null
    }, [file, initialData])
    
    // basically a fucntion to hit our backend with prompt and filedata so that gemini can reply to us with some cool stuff
    const handleSendMessage = async () => {
        if(!input.trim()) return

        // put user's messasg into message arr but keep the previous one too 
        const newMessage = [...messages,{role: 'user', text: input}];
        setMessages(newMessage)

        // clean the input box once the message is sent and lodaer dikhao ki bc gemini is typing and all 
        setInput('')
        setIsTyping(true)

        try {
            // get the token from localstorage mfk 
            const token = localStorage.getItem('paganini_token')

            // now hit gemini 
            const response = await axios.post(
                'http://localhost:3000/api/ai/chat', 
                // 2nd arg the body
                {
                    prompt: input,
                    fileData: initialData.fileData ,  //iske ander hi uri hai humara
                    // our beloved sessionId 
                    sessionId: initialData.sessionId

                    // now we have to tell mfking gemini bout the file ki kaunsi file pr baat ho rhi hai
                    // but frontend ke pass gemini uri bhi toh hona chahiye uske liye
                },
                // the 3rd arg should be our headers
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
        )

            // now jo bhi response aaeyga gemini usko message arr me daal do but protect the previous ones
            setMessages([...newMessage, {role: 'ai', text: response.data.reply }])

        } catch (error) {
            console.log("Chat Error:", error)
        } finally {
            setIsTyping(false)
        }
    }

  return (
    
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden ">

        {/* left part of the screeen */}
        <div className=" lg:w-[72%] bg-black  flex flex-col items-center  ">

                {/* first heading kinda thing  */}
                <h2 className="font-semibold text-neutral-300 px-6 py-4 border-b border-white/5  bg-[#0a0a0a] w-full flex items-center h-14 ">Paganini preview</h2>


            {/* video player */}
            <div className="flex-1 w-full flex items-center justify-around p-2">
                {/* if u got file then show the video */}
                {file ? (
                    <video 
                    className="w-full max-h-[85vh]  rounded-lg shadow-lg object-contain outline-none "
                    controls
                    src={videoUrl}
                    />
                ) :
            // Youtube link passed 
            initialData?.fileData?.uri ? (
                <div className="w-full aspect-video
                rounded-xl shadow-lg overflow-hidden bg-black border border-white/5 h-full
                ">
                    <ReactPlayer
                        src = {videoUrl}
                        // src = {initialData.fileData.uri}
                        controls
                        width="100%"
                        height="100%"
                    />
                </div>
            ) :

                // if video aisnt even there wtf
                (
                <div className="text-neutral-500 font-mono text-sm">
                    No video source found. Please return to the upload screen.
                </div>
                )
            }

            </div>
        </div>

        {/* the right partt */}
        <div className="w-full lg:w-[28%] bg-[#0f0f0f]  flex flex-col border-l border-white/5 h-full overflow-hidden  ">

            {/*heading kinda thing for chat box */}
            <div className="font-semibold text-neutral-300 px-6 py-4 border-b border-white/5 flex items-center h-14 bg-[#0a0a0a] ">
                Ai Assistant
            </div>

            {/* the part wehere message will be shown ig */}
            <div className="flex-1 p-4 overflow-y-auto no-scrollbar  ">
                
                {messages.map((msg, index) => (
                    <div 
                    key={index}
                    className={`p-3 mb-3 text-sm  rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-neutral-200 text-neutral-900 ml-auto' : 'bg-neutral-950 mr-auto border border-neutral-700 text-neutral-100 shadow-lg'}`} >
                        {/* magic beginsss */}
                        <div className={`prose max-w-none text-sm leading-relaxed
                            ${msg.role === 'ai' ? 'prose-invert' : 'text-black' }
                            `}>
                            <ReactMarkdown>
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="bg-neutral-800 p-3 rounded-lg max-w-[85%] text-sm text-neutral-400">
                        Gemini is typing...
                    </div>
                )}

            </div>

            {/* user will type texts here */}
            <div className="p-4 border-t border-white/5 flex gap-3 bg-[#0a0a0a]">
                <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                type="text" 
                className="flex-1 bg-neutral-800 text-white px-3 py-1.5 outline-none border-neutral-700 focus:border-neutral-900
                rounded-lg placeholder:text-neutral-500
                "
                placeholder='Ask something about the video...'
                />
                <Button 
                variant='default'
                onClick={handleSendMessage}
                className="px-6 cursor-pointer font-semibold">
                    Send
                </Button>
            </div>
            
        </div>

    </div>
  )
}
