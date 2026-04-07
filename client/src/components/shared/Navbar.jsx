import React from 'react'

const Navbar = () => {
  return (
    <nav className=" w-full mx-auto px-4 py-1 flex justify-between items-center ">
      {/* logo part */}
      <div className="text-xl font-bold ">
        Paganini
      </div>
      
      {/* right side thing */}
      <div >
        <button className="border px-2 py-0.5 rounded-sm cursor-pointer">
          Login
        </button>
      </div>

    </nav>
  )
}

export default Navbar 