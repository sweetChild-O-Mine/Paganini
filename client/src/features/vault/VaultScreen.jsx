import React from 'react'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import { useEffect, useState } from 'react'


export const VaultScreen = () => {
    const [sessions, setSessions] = useState([])

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

                // wanna take a look of the sessions
                console.log(sessions)
            } catch (error) {
                console.error("Faile to fetch videos T___T :", error)

            }
        }


        getSessions()
    }, [])
  return (
    <div>VaultScreen</div>
  )
}
