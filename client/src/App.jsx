import { useState } from 'react'
import './App.css'
import { Container } from './components/ui/Container'
import Navbar from './components/shared/Navbar'
import { UploadScreen } from './features/upload/UploadScreen'
import { AnalysisScreen } from './features/analysis/AnalysisScreen'



function App() {

  // the data we'll get from gemini
  const [analysisData, setAnalysisData] = useState(null)
  const [videoFile, setVideoFile] = useState(null)

  return (
    <>
    {/* the main outer div */}
      <div className="bg-neutral-900 min-h-screen w-full text-white flex flex-col items-center overflow-hidden">
        {/* container will wrapp all of our section into it and cneter em */}
        <Container className=' ' >
          <Navbar />
        </Container>

        {/* <Container className='flex-1 mt-10 border' > */}

          {/* check if analysisData is ther or not  */}
          {!analysisData ? (
            <UploadScreen
            onAnalysisComplete = {(file, data) => {
              setVideoFile(file)
              // whole parcel from backend but we got it from UploadScreen
              setAnalysisData(data)
            }}
            />
          ) : (
            <AnalysisScreen
              file={videoFile}
              initialData={analysisData}
            />
          ) }
        {/* </Container> */}
      </div>
    </>
  )
}

export default App
