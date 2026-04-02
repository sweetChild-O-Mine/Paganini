import { useState } from 'react'
import './App.css'
import { Container } from './components/ui/Container'
import Navbar from './components/shared/Navbar'
import { UploadScreen } from './features/upload/UploadScreen'
Navbar


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    {/* the main outer div */}
      <div className="bg-neutral-900 min-h-screen text-white flex flex-col items-center">
        {/* container will wrapp all of our section into it and cneter em */}
        <Container className='' >
          <Navbar />
        </Container>

        <Container className='flex-1 mt-10 border' >
          <UploadScreen />
        </Container>
      </div>
    </>
  )
}

export default App
