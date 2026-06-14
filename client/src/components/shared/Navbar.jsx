import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

const Navbar = () => {
    const {token, logout} = useAuthStore()
    const navigate = useNavigate()

    const [isMenuOpen, setIsMenuOpen] = useState(false)
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
                className="flex items-center gap-2 cursor-pointer megrim ">

                <span 
                    onClick={() => navigate('/')}
                    className="font-bold text-white tracking-wide text-xl ">Paganini
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

                <div className="hidden md:flex items-center gap-4">

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

                <button
                    className='md:hidden'
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" fill='white' viewBox="0 0 50 50">
<path d="M 5 8 A 2.0002 2.0002 0 1 0 5 12 L 45 12 A 2.0002 2.0002 0 1 0 45 8 L 5 8 z M 5 23 A 2.0002 2.0002 0 1 0 5 27 L 45 27 A 2.0002 2.0002 0 1 0 45 23 L 5 23 z M 5 38 A 2.0002 2.0002 0 1 0 5 42 L 45 42 A 2.0002 2.0002 0 1 0 45 38 L 5 38 z"></path>
</svg>
                </button>
</div>

        </div>

        {isMenuOpen && (
            <div className="md:hidden flex flex-col gap-4 px-4 py-6 border-t border-white/10 ">
        {/* Nav links */}
        <span onClick={() => { handleNavigation('features'); setIsMenuOpen(false) }} className="text-neutral-300 hover:text-white cursor-pointer transition-colors text-base font-medium py-1">Features</span>
        <span onClick={() => { handleNavigation('how-it-works'); setIsMenuOpen(false) }} className="text-neutral-300 hover:text-white cursor-pointer transition-colors text-base font-medium py-1">How it works</span>
        <span onClick={() => { navigate('/vault'); setIsMenuOpen(false) }} className="text-neutral-300 hover:text-white cursor-pointer transition-colors text-base font-medium py-1">My Vault</span>

        {/* Auth buttons */}
        <div className="pt-2 border-t border-white/5">
            {token ? (
                <Button onClick={() => { handleLogout(); setIsMenuOpen(false) }} variant='destructive' className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold cursor-pointer">
                    Log Out
                </Button>
            ) : (
                <div className="flex flex-col gap-3">
                    <span onClick={() => { navigate('/login'); setIsMenuOpen(false) }} className="text-sm font-medium text-neutral-300 hover:text-white cursor-pointer">Log in</span>
                    <Button onClick={() => { navigate('/register'); setIsMenuOpen(false) }} className="bg-white text-black hover:bg-neutral-200 font-semibold cursor-pointer">Get Started</Button>
                </div>
            )}
        </div>

            </div>
        )}
    </nav>
  )
}

export default Navbar
