import './App.css'
import Navbar from './components/shared/Navbar'
import { UploadScreen } from './features/upload/UploadScreen'
import { AnalysisScreen } from './features/analysis/AnalysisScreen'
import { Routes, Route } from 'react-router-dom'


function App() {

  return (
    <>
    {/* the main outer div */}
      <div className="bg-neutral-900 h-screen w-full text-white flex flex-col items-center overflow-hidden">
          <Navbar />

          {/* oure sexy Routes <3  */}
          <Routes>
            <Route path='/' element={<UploadScreen/>} />
            <Route path='/analysis' element={<AnalysisScreen/>} />
          </Routes>


      </div>
    </>
  )
}

export default App
