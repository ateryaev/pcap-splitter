import { Button, TxtButton } from "./components/Button";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createChunks, parsePcapInfo } from "./utils/pcap";
import { bytesToString, generateChunkName, numToThousands, toZeroLeadIndex } from "./utils/helpers";
import { Window } from "./components/Window"
import { cn } from "./utils/cn";

//let offsets = [];
function Header({ file, pcapHeader, offsets }) {
    //return (<></>);
    return (
        <div>
            <div className="text-ellipsis overflow-hidden whitespace-nowrap" title={file.name}>
                File: {file.name}
            </div>
            <div>Size: {bytesToString(file.size)} ({numToThousands(file.size)} bytes) </div>
            <div>Date: {file.lastModifiedDate.toISOString()}</div>
            <div className="flex gap-2 text-ellipsis overflow-hidden">
                Header:
                <div className="inline-block cursor-default underline underline-offset-2 text-gray-700 decoration-dotted"
                    title={"Magic Number"}>
                    0x{pcapHeader.magicNumber.toString(16)}({pcapHeader.isLittleEndian ? "LE" : "BE"})</div>
                <div className="cursor-default underline underline-offset-2 text-gray-700 decoration-dotted"
                    title="Version">
                    v{pcapHeader.versionMajor}.{pcapHeader.versionMinor}</div>
                <div className="cursor-default underline underline-offset-2 text-gray-700 decoration-dotted"
                    title="Timezone Offset">
                    {pcapHeader.timezoneOffset.toString()}</div>

                <div className="cursor-default underline underline-offset-2 text-gray-700 decoration-dotted"
                    title="Timestamp Accuracy">
                    {pcapHeader.timestampAccuracy.toString()}</div>
                <div className="cursor-default underline underline-offset-2 text-gray-700 decoration-dotted"
                    title="Snapshot Length">
                    {pcapHeader.snapshotLength.toString()}</div>
                <div className="cursor-default underline underline-offset-2 text-gray-700 decoration-dotted"
                    title="Global Network Type">
                    {pcapHeader.globalNetworkType.toString()}</div>
            </div>
            <div>Packets: {numToThousands(offsets.length)}</div>

        </div>
    );
}
export function PageResult({ file, offsets, pcapHeader, onError, onBack }) {
    const [chunkSize, setChunkSize] = useState(10); // chunk size in bytes
    const [newChunkSize, setNewChunkSize] = useState(10); // chunk size in bytes
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

    return (

        <Window action={"back"} onAction={onBack} header={(<Header file={file} pcapHeader={pcapHeader} offsets={offsets} />)}>
            <div className="-mx-2">
                <div className="p-2 py-1" title="Range: 1 to 1024 MB">
                    Chunk size in MB:
                </div>

                <div className='flex pr-[6px] flex-1  rounded-xs  gap-0 items-center border-2 border-blue-300 
                focus-within:ring-4 focus-within:ring-blue-300/50 focus-within:bg-white bg-white'>
                    <input ref={inputRef} type="number" onChange={handleSizeChange} value={(newChunkSize)}
                        className=' outline-none
                      p-[6px] flex-1' />

                    <TxtButton onClick={handleApply} disabled={newChunkSize === chunkSize}>apply</TxtButton>

                </div>

                {!busy && <div className="p-2 pb-1 pt-4">{chunks.length} chunks of {chunkSize} MB size max:</div>}
                {busy && <div className="p-2 pb-1 pt-4">Generating new chunks...</div>}

                <div className="p-0 bg-white rounded-xs border-2 border-blue-300">
                    {chunks.slice(0, maxVisibleChunks).map((chunk, index) => (

                        <div key={index} className={cn("flex p-[6px] gap-2 hover:bg-blue-50", busy && "opacity-50")}>
                            <div className="text-neutral-500">{toZeroLeadIndex(index, chunks.length)}:</div>
                            <div className="flex-1 text-ellipsis overflow-hidden">{generateChunkName(file.name, index, chunks.length)}</div>
                            <div className="text-blue-600">
                                <TxtButton disabled={busy} onClick={() => handleChunkDownload(index)}>download</TxtButton>
                            </div>
                        </div>
                    ))}

                    {chunks.length > maxVisibleChunks && <div className="bg-neutral-50 text-neutral-500 text-center border-t-2 border-neutral-300 p-[6px]">
                        showing first {Math.min(chunks.length, maxVisibleChunks)} of {chunks.length} chunks&nbsp;
                        <TxtButton onClick={() => setMaxVisibleChunks(maxVisibleChunks + 10)}>more</TxtButton>
                    </div>}
                    {chunks.length <= maxVisibleChunks && <div className="bg-neutral-50 text-neutral-500 text-center border-t-2 border-neutral-300 p-[6px]">
                        all {chunks.length} chunks shown
                    </div>}

                </div>

            </div>
        </Window >
    );
}