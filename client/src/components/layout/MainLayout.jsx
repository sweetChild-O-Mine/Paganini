import React from 'react'
import Navbar from '../shared/Navbar'

export const MainLayout = ({children}) => {
  return (
    <div 
    className='min-h-screen bg-gray-900 text-white flex flex-col  '
    >
        {/* navbar will stay on top of EVERY SINGLEE page */}
        <Navbar />
        
        {/* Children will be whatever the screeen you trying to show mfk  */}
        <main className="border max-w-4xl flex-1 flex flex-col">
            {children}
        </main>

    </div>
  )
}
