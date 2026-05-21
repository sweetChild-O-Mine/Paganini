import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'

export const RegisterScreen = () => {
    // states for our input 
    const [name, setName] = useState('')
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState('')

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        // stop the page from refreshing 
        e.preventDefault()

        console.log("User wants to register with:", name,email, password)

        // the axiosss
        try {
            // 1. send data to mfking backend
            const response = await axios.post('http://localhost:3000/api/auth/register', {
                name: name,
                email: email,
                password: password
            })

            console.log("Backend says:", response.data)

            // 2. grab te VIP wristband from backend
            const token = response.data.token

            // 3. now store that token into localstorage 
            localStorage.setItem('paganini_token', token)

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
                type={name}
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
                type={email}
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
                <Input
                type={password}
                // placeholder='Michael Jackson'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white
                required
                " />
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

