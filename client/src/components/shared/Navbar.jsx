import React from 'react'
import { Button } from "@/components/ui/button"
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
    const {token, logout} = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        // wipes the token from localstorage and gloabl state
        logout();

        // kick back the user to the login screen coz they ain got token 
        navigate('/login')
    }

    const handleNavigation = (targetId) => {
        // check if we are on the home page or not 
        if (window.localStorage.pathname !== '/') {
            // if not then go the homepage first
            navigate('/')

            // lets wait for few seconda before we scorll
            setTimeout(() => {
                document.getElementById(targetId)?.scrollIntoView({
                    behavior: 'smooth'
                })
            }, 100);
        } else {
            // that means we are already at home so just scoll smoothly
            document.getElementById(targetId)?.scrollIntoView({behavior: 'smooth'})
        }
    }

  return (
    // Sticky at top, edge-to-edge, backdrop blur, subtle border
    <nav className="w-full sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-4">
        
        <div className="w-full px-2 flex items-center justify-between">
            
            {/* Left: Logo */}
            <div 
                className="flex items-center gap-2 cursor-pointer">

                <span 
                    onClick={() => navigate('/')}
                    className="font-bold text-white tracking-wide text-xl">Paganini
                </span>
            </div>

            {/* Center: Simple Links (No heavy navigation-menu needed) */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
                <span onClick={() => handleNavigation('features')} className="hover:text-white cursor-pointer transition-colors">Features</span>
                <span onClick={() => handleNavigation('how-it-works')} className="hover:text-white cursor-pointer transition-colors">How it works</span>
                <span onClick={() => navigate('/vault')} className="hover:text-white cursor-pointer transition-colors">My Vault</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">

                {token ? (
                    <Button
                        onClick={handleLogout}
                        variant='destructive'
                        className={`rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 px-5 font-semibold cursor-pointer`}
                    >
                        Log Out
                    </Button>
                ) : (
                    <>
                        <span 
                            onClick={() => navigate('/login')}
                            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors hidden sm:block cursor-pointer" 
                        
                        >
                            Log in
                        </span>
                        
                        <Button 
                            onClick={() => navigate('/register')}
                            className="rounded-md bg-white text-black hover:bg-neutral-200 px-5 font-semibold cursor-pointer">
                                Get Started
                        </Button>
                    
                    </>
                ) }

            </div>

        </div>
    </nav>
  )
}

export default Navbar
