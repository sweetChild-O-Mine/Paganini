import React from 'react'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { Clock, PlayCircle,Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';



export const VaultScreen = () => {
    const [sessions, setSessions] = useState([])

    const navigate = useNavigate()

    useEffect(() => {

        const getSessions = async () => {
            try {
                const token = localStorage.getItem('paganini_token')
    
                const response = await axios.get(
                    'http://localhost:3000/api/ai/sessions',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                )

                // ijust wanna take a look ?___?
                console.log(response)
                // now get the data into our sessions array usestate
                setSessions(response.data.videos)


            } catch (error) {
                console.error("Faile to fetch videos T___T :", error)

            }
        }


        getSessions()
    }, [])

    const handleResumeChat = (session) => {
        // teleport to analysisscreen with the session data
        navigate('/analysis', {
            state: {
                file: null,
                initialData: {
                    sessionId: session._id,
                    playableUrl: session.videoUrl,
                    fileData: { uri: session.geminiFileUri }
                }
            }
        })
    }

    const handleDeleteSession = (sessionId) => {
        // 1. give me them chance to back out....like you really sure mfk ??
        // if(!window.confirm("Are you sure you want to delete this session? This cannot be undone")) return

        toast("Are you sure you want to delete this session?" , {
            action: {
                label: "Delete",
                onClick: async() => {
                    try {
                        // get the token 
                        const token = localStorage.getItem('paganini_token')
            
                        // 2. tell the backend ki udaaa do bc
                        await axios.delete(
                            `http://localhost:3000/api/ai/session/${sessionId} `,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`
                                }
                            }
                        )
            
                        // now remove it form the reasct state too so they dont have to refresh page to make it disapper
                        setSessions((prevSessions) => prevSessions.filter(session => session._id !== sessionId))
            
                        // show the msg
                        toast("Session successfully deleted.");
                    } catch (error) {
                        console.error("Delete Error:", error)
                        toast("Failed to delete session.");
                    }
                }
            },
            cancel: {
                label: "Cancel"
            }
        })
    }

    // wanna take a look of the sessions
    console.log(sessions)

  return (
    <div className='flex-1 w-full bg-[#0a0a0a] text-white pt-24 px-6 pb-24 relative overflow-x-hidden overflow-y-auto no-scrollbar  '
    >
        {/* the glowing background thing */}
        <div className="absolute top-[22%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"/>

        <div className="absolute top-[30%] left-[25%] w-[400px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="absolute top-[30%] right-[25%] w-[400px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="absolute top-[22%] right-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"/>



        {/* something cool idk */}
        <div className="relative z-10 max-w-6xl mx-auto">
            {/* the header */}
            <div className="text-center mb-16">
                <h1 className="text-6xl prata-regular font-bold tracking-tight mb-6 ">
                    My Vault
                </h1>
                <p className="text-neutral-400 text-lg max-w-xl mx-auto">
                    Your archive of past AI-powered video conversations. Revisit, reflect, and continue where you left off.
                </p>
            </div>

            {/* the griddd */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* the main map  */}
                {sessions.map((session) => (

                    // tmeporary card 
                    <div 
                        key={session._id}
                        className="border bg-neutral-900/40 backdrop-blur-md border-white/5 rounded-2xl p-6 flex flex-col hover:bg-neutral-800/40 transition-colors shadow-xl duration-100 h-full">

                            {/* card header with data and source tag */}
                            <div className="flex justify-between items-center text-xs text-neutral-400 mb-4  ">

                                <div className="flex items-center gap-2 border border-white/20 p-1 px-1.5 rounded-md">
                                    <Clock size={14} />
                                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    
                                    {/* sourceType */}
                                    <span className="uppercase tracking-wider px-2 py-1 bg-neutral-800/70 rounded-md text-[10px]">
                                        {session.sourceType}
                                    </span>

                                    <button 
                                        onClick={() => handleDeleteSession(session._id)}
                                        className="text-neutral-500 hover:text-red-500 transition-colors cursor-pointer">
                                            <Trash2 size={16} />
                                    </button>                                    
                                </div>

                            </div>

                            {/* card title */}
                            <h3 className=" text-2xl font-medium text-neutral-200 mb-6 mt-2 line-clamp-2">
                                {session.title}
                            </h3>

                            {/* resume chat button  */}
                            <Button
                                onClick={() => handleResumeChat(session)}
                                className={`w-full mt-auto mb-2 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer group`}
                            >
        <PlayCircle className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Resume Chat

                            </Button>

                        </div>
                ))}
            </div>
        </div>
    </div>
  )
}

