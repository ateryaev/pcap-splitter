import { useState, useRef, useEffect } from 'react';
import { readPcapGlobalHeader, readPcapPacketOffsets } from "./utils/pcap";
import { bytesToString, numToThousands } from "./utils/helpers";
import { Window } from "./components/Window"

export function PageIndexing({ file, onCancel, onError, onComplete }) {
    const [indexingProgress, setIndexingProgress] = useState(0); // Progress percentage of indexing, 0..100

    useEffect(() => {

        let isMounted = true; // Flag to track if the component is mounted

        const runIndexing = async () => {
            let offsets = [];
            console.log("START indexing file: ", file?.name)
            try {
                //await wait(1000);

                const pcapHeader = await readPcapGlobalHeader(file);
                console.log(pcapHeader)
                const readingLength = 50 * 1024 * 1024;
                let readingStart = 24;
                console.time("INDEXING")
                while (readingStart && isMounted) {
                    readingStart = await readPcapPacketOffsets(file, readingStart, readingLength, offsets);
                    setIndexingProgress(Math.floor(100 * readingStart / file.size))
                }
                console.timeEnd("INDEXING") // 143,543
                if (isMounted) onComplete(offsets, pcapHeader);
            } catch (err) {
                isMounted && onError && onError(err.message);
            }
        };

        runIndexing();

        return () => {
            isMounted = false;
        };
    }, [file]);


    function handleCancel() {
        onCancel();
    }

    return (
        <Window action={"cancel"} onAction={handleCancel} className="w-[512px]" >
            {file?.name && <div>
                <div className="text-ellipsis overflow-hidden whitespace-nowrap" title={file.name}>
                    Indexing: {file.name}
                </div>
                <div>Size: {bytesToString(file.size)} ({numToThousands(file.size)} bytes) </div>
                <div>Progress: {indexingProgress}%</div>
            </div>}
        </Window>
    );
}