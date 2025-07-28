import { useEffect, useState } from 'react'
import './App.css'
import { PageStart } from './PageStart'
import { usePageHistory } from './components/PageHistory'
import { PageResult } from './PageResult'
import { PageIndexing } from './PageIndexing'
import { PageError } from './PageError'

function App() {
  const PAGE_START = "start";
  const PAGE_LOADING = "PAGE_LOADING";
  const PAGE_ERROR = "PAGE_ERROR";
  const PAGE_RESULT = "PAGE_RESULT";

  const { currentPage, pushPage, replacePage, goBack } = usePageHistory();

  const [file, setFile] = useState(null);
  const [offsets, setOffsets] = useState(null);
  const [pcapHeader, setPcapHeader] = useState(null);

  useEffect(() => {
    console.log("PAGE:", currentPage)
  }, [currentPage])

  useEffect(() => {
    console.log("window.history.state:", window.history.state)
  }, [window.history.state])

  const handleFilePick = (f) => {
    console.log("handleFilePick", f.name)
    setFile(f);
    pushPage(PAGE_LOADING);
  }

  function handleIndexingComplete(newOffsets, newPcapHeader) {
    console.log("handleIndexingComplete", newOffsets, newPcapHeader);
    setOffsets(newOffsets);
    setPcapHeader(newPcapHeader);
    replacePage(PAGE_RESULT)
  }

  function handleError(err) {
    console.error("Error:", err);
    replacePage(PAGE_ERROR, err)
  }

  return (
    <div className={`min-h-dvh  min-w-xs gap-2 p-2 mx-auto flex flex-col justify-center items-center`}>
      <div className="flex-1 flex flex-col justify-center items-center w-full">
        {currentPage === PAGE_START && <PageStart onPick={handleFilePick} />}
        {currentPage === PAGE_LOADING && <PageIndexing file={file} onError={handleError} onComplete={handleIndexingComplete} onCancel={goBack} />}
        {currentPage === PAGE_ERROR && <PageError onBack={goBack} />}
        {currentPage === PAGE_RESULT && <PageResult onError={handleError} file={file} offsets={offsets} pcapHeader={pcapHeader} onBack={goBack} />}
      </div>
      <div className="text-center text-xs text-gray-700">
        Pcap File Splitter v1.0, <a href="https://github.com/ateryaev/pcap-splitter" className='underline' target='blank'>github.com</a>
        <br />
        Developed by Anton Teryaev, 2025
      </div>
    </div>
  );

}

export default App
