import React, { useState, useMemo} from 'react'
import axios from 'axios'

// managaer has sent someth that's why employee willrecienve it and he's doing it
export const AnalysisScreen = ({file, initialData}) => {
    const [messages, setMessages] = useState([
        { role : 'ai', text: initialData?.analysis }
    ])

    const [input, setInput] = useState('')
    // when gemini doing analysis and trying to generate the response toh us time there must be smth to show
    const [isTyping, setIsTyping] = useState(false)

    // this well tell the react ki is URL ko ek baar banao sirf....when file is uplaoded...dont make it again and again
    const videoUrl = useMemo(() => {
        if (file) return URL.createObjectURL(file)
        return null
    }, [file])
    
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
            // now hit gemini 
            const response = await axios.post('http://localhost:3000/api/ai/chat', {
                prompt: input,
                fileData: initialData.fileData   //iske ander hi uri hai humara

                // now we have to tell mfking gemini bout the file ki kaunsi file pr baat ho rhi hai
                // but frontend ke pass gemini uri bhi toh hona chahiye uske liye
            })

            // now jo bhi response aaeyga gemini usko message arr me daal do but protect the previous ones
            setMessages([...newMessage, {role: 'ai', text: response.data.reply }])

        } catch (error) {
            console.log("Chat Error:", error)
        } finally {
            setIsTyping(false)
        }
    }

  return (
    // we'll use grid for division in 2 parts basically 
    <div className="w-full h-full flex flex-col lg:flex-row px-1 py-4 overflow-hidden ">

        {/* left part of the screeen */}
        <div className="border border-neutral-800 lg:w-[72%] bg-black  flex flex-col items-center  ">

                {/* first heading kinda thing  */}
                <h2 className="font-semibold text-neutral-300 px-4 py-4 border font-mono bg-black/50  border-neutral-800 w-full ">Paganini preview</h2>


            {/* video player */}
            <div className="flex-1 w-full flex items-center justify-around p-2">
                {/* if u got file then show the video */}
                {file && (
                    <video 
                    className="w-full max-h-[85vh]  rounded-lg shadow-lg object-contain outline-none "
                    controls
                    src={videoUrl}
                    />
                )}

            </div>
        </div>

        {/* the right partt */}
        <div className="w-full lg:w-[28%] bg-[#0f0f0f] border-l  border-white/10 flex flex-col ">

            {/*heading kinda thing for chat box */}
            <div className="p-4 border border-neutral-700 bg-black font-bold text-neutral-300 ">
                Ai Assistent
            </div>

            {/* the part wehere message will be shown ig */}
            <div className="flex-1 p-4 max-h-[760px] overflow-y-auto element ">
                
                {messages.map((msg, index) => (
                    <div 
                    key={index}
                    className={`p-3 mb-3 text-sm rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-blue-400 ml-auto' : 'bg-transparent mr-auto border border-neutral-950 text-neutral-100 shadow-lg'}`} >
                        <p className="text-sm shadow-md text-neutral-200">
                            {msg.text}
                        </p>
                    </div>
                ))}

                {isTyping && (
                    <div className="bg-neutral-800 p-3 rounded-lg max-w-[85%] text-sm text-neutral-400">
                        Gemini is typing...
                    </div>
                )}

            </div>

            {/* user will type texts here */}
            <div className="p-4 border-t border-e-neutral-800 flex gap-2">
                <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                type="text" className="flex-1 bg-neutral-800 text-white px-3 py-1.5 outline-none focus:border-neutral-500
                rounded-lg 
                "
                placeholder='Ask something about the video...'
                />
                <button 
                onClick={handleSendMessage}
                className="bg-neutral-700 hover:bg-neutral-800 px-6 py-2 rounded-lg font-bold transform cursor-pointer">

                    Send
                </button>
            </div>
            
        </div>

    </div>
  )
}
