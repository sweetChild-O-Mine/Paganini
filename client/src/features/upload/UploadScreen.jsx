import React from 'react'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'



export const UploadScreen = () => {

  // this will rememebr which file has been uploaded
  const [file, setFile] = useState(null)

  // my onDrop function
  const onDrop = useCallback((acceptedFiles) => {

    // get the first fking firl from the acceptedFIles 
    const droppedFile = acceptedFiles[0]
    console.log("We got the File!!!", droppedFile)

    // save this file inside....basically container me daaldo my lad!!!
    setFile(droppedFile)
  }, [])

  // we will give useDropzone to our onDrop to run 
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    // whever onDrop recevie file then what we gotta do with it 
    onDrop,
    // which files to allow
    accept: { 'video/*': [] },
    maxFiles: 1
  })


  return (
    <div className='flex flex-col border items-center justify-center py-20  '>
      {/* text contaienrn  */}
      <div className="border mt-10 p-4 flex flex-col space-y-6">
        <h1 className="text-4xl text-center">Analyze your video with AI</h1>
        <p className="text-2xl text-center">Drag and drop your video file here</p>

        {/* checck if file state me actualy koi file hai bhi ya nahi...if it izz there then show the video player and if its not then just show the dropzone */}
        {file ? (
          <div className="w-full flex flex-col items-center justify-center mt-10 space-y-4">

            {/*put the video player of html sir   */}
            <video
              className="w-full max-w-2xl rounded-xl border border-neutral-700 shadow-lg"
              controls
              autoPlay
              // the BLOB url
              src={URL.createObjectURL(file)}
            />

            {/* button to remove the wrong video if tis been uplaoded by mistake */}
            <div className="flex gap-4">
              <button
                onClick={() => setFile(null)}
                className='px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition cursor-pointer'
              >
                Remove
              </button>
              <button className="px-6 py-2 bg-neutral-800 hover:bg-neutral-900 rounded-lg transition font-bold">
                Analyze with Gemini!!
              </button>
            </div>

          </div>
        ) : (
          // if file aint there then show the fking dropzone
          // DROPZONE are it izzzzz
          <div
            {...getRootProps()}
            className="border-2 border-dotted border-gray-600 rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-900 transition p-4 ">

            {/* put this getInputProps on this invisble input thing */}
            <input {...getInputProps()} />
            {/* if some nigga's trying to drag then change the text please */}
            {isDragActive ? (<p className='text-xl'> Drop the video here... </p>) : (<p className='text-xl text-neutral-700'>Drag 'n' drop your video here, or click to select file.</p>
            )}
          </div>
        )}


        {/* test it mfk  */}
        {file && (
          <div className="mt-4 text-sm text-green-400">File Selected: {file.name} </div>
        )}
      </div>
    </div>
  )
}