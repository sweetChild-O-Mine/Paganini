import React from 'react'

export const Container = ({children, className = ""}) => {
  return (
    <div className={`max-w-[1980px] mx-auto px-2 py-4 w-full bg-transparent border ${className}`} >
        {children}
    </div>

  )
}
        