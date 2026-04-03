import React from 'react'

// managaer has sent someth that's why employee willrecienve it and he's doing it
export const AnalysisScreen = ({file, intialData}) => {
  return (
    // we'll use grid for division in 2 parts basically 
    <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">

        {/* left part of the screeen */}
        <div className="border border-neutral-800 rounded-2xl bg-neutral-900/50 p-4 flex flex-col items-center">
            {/* first heading kinda thing  */}
            <h2 className="text-xl font-bold mb-4 text-neutral-400">Video Preview</h2>

            {/* if u got file then show the video */}
            {file && (
                <video 
                className="w-full rounded-lg shadow-lg border border-neutral-700"
                controls
                src={URL.createObjectURL(file)}
                />
            )}
        </div>

        {/* the right partt */}
        <div className="border border-neutral-800 rounded-xl bg-neutral-900/50 flex flex-col h-[70vh]">

            {/*heading kinda thing for chat box */}
            <div className="p-4 border-b border-neutral-800 font-bold text-neutral-300">
                Paganini's Analysis chat
            </div>

            {/* the part wehere message will be shown ig */}
            <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-neutral-500 text-sm">
                    First text of Gemini
                </p>
                {/* print the data you get from managaer */}
                <div className="bg-neutral-800 p-3 rounded-lg mt-2 text-sm text-neutral-200 shadow-md">
                    {intialData}
                </div>
            </div>

            {/* user will type texts here */}
            <div className="p-4 border-t border-e-neutral-800 flex gap-2">
                <input type="text" className="flex-1 bg-neutral-800 border border-neutral-700 text-white p-2 outline-none focus:border-neutral-500"
                placeholder='Ask something about the video...'
                />
                <button className="bg-neutral-700 hover:bg-neutral-800 px-6 py-2 rounded-lg font-bold transform cursor-pointer">
                    Send
                </button>
            </div>
            
        </div>

    </div>
  )
}
