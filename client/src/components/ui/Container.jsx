import React from 'react'

export const Container = ({children, className = ""}) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 py-4 w-full bg-gray-950 ${className}`} >
        {children}
    </div>
  )
}
        