import { TxtButton } from "./components/Button";
import { useState, useRef, useEffect, useMemo, Children } from 'react';
import { createChunks } from "./utils/pcap";
import { bytesToString, generateChunkName, loadFromLocalStorage, numToThousands, saveToLocalStorage, toZeroLeadIndex } from "./utils/helpers";
import { Window } from "./components/Window"
import { cn } from "./utils/cn";

function Header({ file, pcapHeader, offsets }) {
    function HeaderField({ title, children }) {
        return (
            <div className="cursor-default group px-1 bg-white hover:bg-blue-50"
            >
                <div class="absolute -mt-5 select-none -ml-1 opacity-90 hidden z-10 group-hover:block bg-white text-blue-600 shadow-xs px-1
              whitespace-nowrap">
                    {title}
                </div>

                {children}

                {/* <div className="bg-black text-white p-1 opacity-50 absolute bottom-[125%]">test</div> */}
            </div>
        )
    }
    return (
        <div>
            <div className="text-ellipsis overflow-hidden whitespace-nowrap" title={file.name}>
                File: {file.name}
            </div>
            <div>Size: {bytesToString(file.size)} ({numToThousands(file.size)} bytes) </div>
            <div>Date: {file.lastModifiedDate.toISOString()}</div>
            <div className="flex gap-2 text-ellipsis overflow-hiddenx">
                Header:
                <HeaderField title={"Magic Number"}>
                    0x{pcapHeader.magicNumber.toString(16)}({pcapHeader.isLittleEndian ? "LE" : "BE"})
                </HeaderField>
                <HeaderField title="Version">
                    v{pcapHeader.versionMajor}.{pcapHeader.versionMinor}
                </HeaderField>
                <HeaderField title="Timezone Offset">
                    {pcapHeader.timezoneOffset.toString()}
                </HeaderField>

                <HeaderField title="Timestamp Accuracy">
                    {pcapHeader.timestampAccuracy.toString()}</HeaderField>
                <HeaderField title="Snapshot Length">
                    {pcapHeader.snapshotLength.toString()}</HeaderField>
                <HeaderField title="Global Network Type">
                    {pcapHeader.globalNetworkType.toString()}</HeaderField>
            </div>
            <div>Packets: {numToThousands(offsets.length)}</div>

        </div>
    );
}
export function PageResult({ file, offsets, pcapHeader, onError, onBack }) {

    console.log("PCAP-SPLITTER-SETTINGS", loadFromLocalStorage("PCAP-SPLITTER-SETTINGS", { chunkSize: 20 }).chunkSize)

    //20 MB default chunk size. Next time load from local storage.
    const [chunkSize, setChunkSize] = useState(loadFromLocalStorage("PCAP-SPLITTER-SETTINGS", { chunkSize: 20 }).chunkSize);
    const [newChunkSize, setNewChunkSize] = useState(loadFromLocalStorage("PCAP-SPLITTER-SETTINGS", { chunkSize: 20 }).chunkSize);
    const [chunks, setChunks] = useState([]); // [{offset, length, timestamp}]
    const [maxVisibleChunks, setMaxVisibleChunks] = useState(10);
    const [busy, setBusy] = useState(false);

    const invalidData = useMemo(() => (!file || !offsets || !pcapHeader), [file, offsets, pcapHeader])

    useEffect(() => {
        invalidData && onError && onError("File not loaded!")
    }, [invalidData]);


    if (invalidData) {
        return <>NO FILE!</>
    }

    useEffect(() => {
        if (invalidData) return;
        setBusy(true);
        setTimeout(() => {
            setChunks(createChunks(offsets, chunkSize * 1024 * 1024));
            setMaxVisibleChunks(10);
            setBusy(false);
        }, 100);
        saveToLocalStorage("PCAP-SPLITTER-SETTINGS", { chunkSize })

    }, [chunkSize, invalidData]);


    function downloadChunk(file, offset, length, chunkFilename) {

        if (offset < 0 || length <= 0 || offset + length > file.size) {
            console.error("Invalid chunk parameters", { offset, length, fileSize: file.size });
            return;
        }

        //console.log("chunkFullFilename", chunkFullFilename);

        //blob: add pcap global header from the file
        const blobHeader = file.slice(0, 24);
        const blobData = file.slice(offset, offset + length);
        const blob = new Blob([blobHeader, blobData], { type: 'application/vnd.tcpdump.pcap' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = chunkFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    function handleChunkDownload(index) {
        const chunk = chunks[index];
        downloadChunk(file, chunk.offset, chunk.length, generateChunkName(file.name, index, chunks.length));

    }
    const inputRef = useRef(null);

    function handleSizeChange() {
        setNewChunkSize(inputRef.current.value);
    }

    function handleApply() {
        let newValue = Number.parseInt(newChunkSize) || 10;
        if (newValue < 1) newValue = 1;
        if (newValue > 1024) newValue = 1024;
        setNewChunkSize(newValue);
        setChunkSize(newValue);
    }
    function handleKeyDown(e) {
        if (e.key === "Enter") handleApply();
    }

    return (

        <Window action={"back"} onAction={onBack} header={(<Header file={file} pcapHeader={pcapHeader} offsets={offsets} />)}>
            <div className="-mx-2">
                <div className="p-2 py-1" title="Range: 1 to 1024 MB">
                    Chunk size in MB:
                </div>

                <div className='flex pr-[6px] flex-1  rounded-xs  gap-0 items-center border-2 border-blue-300 
                focus-within:ring-4 focus-within:ring-blue-300/50 focus-within:bg-white bg-white'>
                    <input ref={inputRef} type="number" onChange={handleSizeChange} value={(newChunkSize)}
                        onKeyDown={handleKeyDown}
                        className=' outline-none p-[6px] flex-1' placeholder="E.g. 10 MB" />

                    <TxtButton onClick={handleApply} disabled={newChunkSize.toString() === "" || newChunkSize.toString() === chunkSize.toString()}>apply</TxtButton>

                </div>

                {!busy && <div className="p-2 pb-1 pt-4">{chunks.length} chunks of {chunkSize} MB size max:</div>}
                {busy && <div className="p-2 pb-1 pt-4">Generating new chunks...</div>}

                <div className={cn("p-0 rounded-xs border-2 border-neutral-300 flex flex-col gap-px bg-neutral-300", busy && "opacity-50")}>
                    <div className="bg-white">

                        {chunks.slice(0, maxVisibleChunks).map((chunk, index) => (

                            <div key={index}
                                title={`offset ${numToThousands(chunk.offset)}, length ${numToThousands(chunk.length)}`}
                                className={cn("flex p-[6px] gap-2 hover:bg-blue-50")}>
                                <div className="text-neutral-500">{toZeroLeadIndex(index, chunks.length)}:</div>
                                <div className="flex-1 text-ellipsis overflow-hidden">
                                    {generateChunkName(file.name, index, chunks.length)}
                                </div>
                                <div className="text-blue-600">
                                    <TxtButton disabled={busy} onClick={() => handleChunkDownload(index)}>download</TxtButton>
                                </div>
                            </div>
                        ))}
                        {chunks.length === 0 && <div className="p-1.5 text-center">...</div>}
                    </div>
                    <div className="bg-neutral-50 text-neutral-500 text-center xborder-t-2 border-neutral-300 p-[6px]">
                        {chunks.length > maxVisibleChunks &&
                            <>
                                showing first {Math.min(chunks.length, maxVisibleChunks)} of {chunks.length} chunks&nbsp;
                                <TxtButton disabled={busy} onClick={() => setMaxVisibleChunks(maxVisibleChunks + 10)}>more</TxtButton>
                            </>}
                        {chunks.length > 0 && chunks.length <= maxVisibleChunks && <>all {chunks.length} chunks shown</>}
                        {chunks.length === 0 && <>no chunks yet</>}
                    </div>


                </div>

            </div>
        </Window >
    );
}