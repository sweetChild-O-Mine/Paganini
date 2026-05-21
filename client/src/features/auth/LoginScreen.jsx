import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

export const LoginScreen = () => {
    // states for our input 
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState("")

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        // will stop the page from refreshing when you click on submit
        e.preventDefault()

        console.log("User wants to login with:", email, password)

        // the axiosssss will gooo heree
        try {
            // 1. send the data to mfkin backend
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                email: email, 
                password: password
            })

            // 2. grab the VIP wristband from backend
            const token = response.data.token

            // 3. store the wristband into localStoargw
            localStorage.setItem('paganini_token', token)

            // phase 4 send the person to the vault

            navigate('/analysis')

        } catch (error) {
            // if backed thorws error then axios must need to catch it and tell us
            console.error("Auth Error:", error.response?.data?.error)
            alert(error.response?.data?.error || "Server went boom")
        }

    }
    
  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Welcome Back
        </h2>

        <form 
        onSubmit={handleSubmit}
        className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm text-neutral-400">
                    Email
                </label>
                <Input
                type={email}
                placeholder='your@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white"
                required
                />
            </div>

            <div className="flex flex-col gap-2">
                <label htmlFor='password' className="text-sm text-neutral-400">Password</label>
                <Input 
                type={password}
                // placeholder="***********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-neutral-800 border-neutral-700 placeholder:font-bold text-white"
                required
                />
            </div>

            <Button
            type="submit"
            className="w-full mt-4 bg-white text-black cursor-pointer hover:bg-neutral-200"
            >
                Sign In
            </Button>

            <p className="mt-6 text-center text-sm text-neutral-500 ">
                Don't have an account? <span
                 onClick={() => navigate('/register')} 
                 className='mx-1 text-white cursor-pointer hover:underline'
                 >
                    Register
                 </span>
            </p>

        </form>

    </div>
  )
}
