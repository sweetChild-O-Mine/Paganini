import React from 'react'
import { Button } from "@/components/ui/button"

const Navbar = () => {
  return (
    // Sticky at top, edge-to-edge, backdrop blur, subtle border
    <nav className="w-full sticky top-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10 px-6 py-4">
        
        <div className="w-full px-2 flex items-center justify-between">
            
            {/* Left: Logo */}
            <div className="flex items-center gap-2 cursor-pointer">
                <span className="font-bold text-white tracking-wide text-xl">Paganini</span>
            </div>

            {/* Center: Simple Links (No heavy navigation-menu needed) */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
                <span className="hover:text-white cursor-pointer transition-colors">Features</span>
                <span className="hover:text-white cursor-pointer transition-colors">How it works</span>
                <span className="text-white cursor-pointer transition-colors">My Vault</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                <span className="text-sm font-medium text-neutral-300 hover:text-white cursor-pointer transition-colors hidden sm:block">
                    Log in
                </span>
                
                <Button className="rounded-md bg-white text-black hover:bg-neutral-200 px-5 font-semibold">
                    Get Started
                </Button>
            </div>

        </div>
    </nav>
  )
}

export default Navbar
