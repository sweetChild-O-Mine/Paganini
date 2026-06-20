import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { Eye, EyeOff } from 'lucide-react'

import { GoogleLogin } from '@react-oauth/google'

export const RegisterScreen = () => {
    // states for our input 
    const [name, setName] = useState('')
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const navigate = useNavigate()

    const login = useAuthStore((state) => state.login)

    const handleSubmit = async (e) => {
        // stop the page from refreshing 
        e.preventDefault()

        console.log("User wants to register with:", name, email, password)

        // the axiosss
        try {
            // 1. send data to mfking backend
            const response = await axios.post('https://13.203.76.37.nip.io/api/auth/register', {
                name: name,
                email: email,
                password: password
            })

            console.log("Backend says:", response.data)

            // 2. grab te VIP wristband from backend
            const token = response.data.token

            // 3. now store that token into localstorage 
            login(token)

            // phase 3:- send the user to thevault
            navigate('/analysis')

        } catch (error) {
            // if backend thorws error then we need someoen to catch it so maybe we can catch that mfker here 
            console.log("Auth Error:", error.response?.data?.error)
            alert(error.response?.data?.error || 'server went booommmmm.')
        }
    }

    return (
        <div className='border mt-20 w-full max-w-md mx-auto p-8 bg-neutral-900 border-neutral-800 rounded-2xl shadow-2xl'>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Create an Account
            </h2>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4">
                {/* div 1 for name*/}
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm text-neutral-400">Name</label>
                    <Input
                        type="name"
                        placeholder='Michael Jackson'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-white
                required
                " />
                </div>

                {/* div for gmail */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm text-neutral-400">Email</label>
                    <Input
                        type="email"
                        placeholder='michael@gmail.com'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-neutral-800 border-neutral-700 text-white
                required
                " />
                </div>

                {/* div for password */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm text-neutral-400">Pasword</label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            // placeholder='Michael Jackson'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-neutral-800 border-neutral-700 text-white pr-10"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="mt-4 flex justify-center">
                    <GoogleLogin
                        onSuccess={async (credenialResponse) => {
                            try {
                                const response = await axios.post('https://13.203.76.37.nip.io/api/auth/google',
                                    {
                                        token: credenialResponse.credential
                                    }
                                )

                                // grab the token from backend
                                const paganiniToken= response.data.token

                                // store it 
                                login(paganiniToken)

                                // sned the person 
                                navigate('/')
                                console.log("Success! Google sent us:", credenialResponse)

                            } catch (error) {
                                console.error("Google Login Backend Error:", error)
                            }
                        }}
                        onError={() => {
                            console.log("Login Failed")
                        }}
                        theme='filled_black'
                        text='signup_with'
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full mt-4 bg-white text-black cursor-pointer hover:bg-neutral-200"
                >
                    Register
                </Button>

                <p className="mt-6 text-center text-sm text-neutral-500">
                    Already have an account? <span
                        onClick={() => navigate('/login')}
                        className="mx-1 text-white cursor-pointer hover:underline">
                        Login
                    </span>
                </p>

            </form>

        </div>

    )
}

