// Implement parsePcapInfo and indexPcapOffset functions:

// // example of onNextPacket implementation
// // function handleNextPacket(index, offset, timestamp, file) {
// //     console.log(`Packet #${index}, offset in file: ${offset}, capture time: ${timestamp}`);
// //     return index < 1000; //want to continue?
// // }
// // example of onDone implementation
// // function handleDone(file) {
// //     console.log(`Indexing done: `, file.size);
// // }



// export async function parsePcapInfo() {

//     //implement with pcap global header parsing

//     return {
//     magicNumber,
//     isLittleEndian,
//     versionMajor,
//     versionMinor,
//     timezoneOffset,
//     timestampAccuracy,
//     snapshotLength,
//     globalNetworkType
//     }
// }

// export async function indexPcapOffset(file, onNextPacket, onDone) {
//     // parse pcap file packet by packet and call onNextPacket for every packet
// 	// print warning if last packet is truncated
//     // use stream().getReader() for fast processing of huge files
//     // never re-read from stream
//     // avoid copying buffers as much as possible
// 	// avoid using "buffer = buffer.slice(totalLen);" try some "cursor" approach
//     // stop parsing on file end or onNextPacket returns false
// 	// call onDone in the end
// 	// run reader.releaseLock in the end
// }



// const PCAP_GLOBAL_HEADER_SIZE = 24;
// const PCAP_PACKET_HEADER_SIZE = 16; // timestamp_sec, timestamp_usec, incl_len, orig_len
// const MAGIC_NUMBER_LE = 0xD4C3B2A1; // Little-endian magic number
// const MAGIC_NUMBER_LE_NG = 0x4D3CB2A1; // Little-endian magic number next gen
// const MAGIC_NUMBER_BE = 0xA1B2C3D4; // Big-endian magic number
export async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(() => { resolve(); }, ms);
    });
}

function isLE(magic) {
    const magics = [0xD4C3B2A1, 0x4D3CB2A1, 0xA1B2C3D4];
    if (!magics.includes(magic)) throw new Error("Invalid PCAP header: magic number is 0x" + magic.toString(16));
    return magic === 0xD4C3B2A1 || magic === 0x4D3CB2A1;
}
export async function parsePcapInfo(file) {
    const reader = file.stream().getReader();
    const { value: header } = await reader.read();
    if (!header || header.byteLength < 24) throw new Error("File too small to be PCAP file");

    const dv = new DataView(header.buffer, header.byteOffset, 24);
    const magicNumber = dv.getUint32(0, false);
    const le = isLE(magicNumber);
    reader.releaseLock();
    return {
        magicNumber,
        isLittleEndian: le,
        versionMajor: dv.getUint16(4, le),
        versionMinor: dv.getUint16(6, le),
        timezoneOffset: dv.getInt32(8, le),
        timestampAccuracy: dv.getUint32(12, le),
        snapshotLength: dv.getUint32(16, le),
        globalNetworkType: dv.getUint32(20, le)
    };
}

let running = false;
let stopping = false;

export async function indexPcapOffset(file, onNextPacket, onDone) {
    stopping = true;
    while (running) {
        await wait(100);
    }
    running = true;
    stopping = false;

    const reader = file.stream().getReader();

    try {
        console.time("indexPcapOffset");
        let offset = 24;
        let packetIndex = 0;
        const { value: globalHeader } = await reader.read();
        if (!globalHeader || globalHeader.byteLength < 24) return onDone(file);

        const dv = new DataView(globalHeader.buffer, globalHeader.byteOffset, 24);
        const magicNumber = dv.getUint32(0, false);
        const le = isLE(magicNumber);

        let buffer = new Uint8Array(globalHeader.buffer.slice(24));
        let cursor = 0;

        while (!stopping) {
            const { value, done } = await reader.read();
            if (value) {
                const newBuf = new Uint8Array(buffer.length - cursor + value.length);
                newBuf.set(buffer.subarray(cursor));
                newBuf.set(value, buffer.length - cursor);
                buffer = newBuf;
                cursor = 0;
            }

            while (buffer.length - cursor >= 16) {
                const headerView = new DataView(buffer.buffer, buffer.byteOffset + cursor, 16);
                const inclLen = headerView.getUint32(8, le);
                const tsSec = headerView.getUint32(0, le);
                const tsUsec = headerView.getUint32(4, le);
                const timestamp = tsSec + tsUsec / 1e6;
                const totalLen = 16 + inclLen;
                if (buffer.length - cursor < totalLen) break;

                const shouldContinue = onNextPacket(packetIndex++, offset, timestamp, file);
                offset += totalLen;
                cursor += totalLen;

                if (!shouldContinue) return;
            }

            if (done) {
                if (buffer.length - cursor > 0) console.warn("Warning: last packet might be truncated.");
                return;
            }
        }
    } catch (err) {
        console.error(err);
    }
    finally {
        if (!stopping) onDone();
        running = false;
        stopping = false;
        reader.releaseLock();
        console.timeEnd("indexPcapOffset");
    }

}

export function createChunks(offsets, chunkSizeBytes) {
    const chunks = [];
    console.log("createChunks", offsets, chunkSizeBytes)
    console.time("createChunks");
    //let currentSize = 0;
    let startOffset = offsets[0];
    //let startTimestamp = offsets[0].timestamp;

    for (let i = 1; i < offsets.length; i++) {
        const nextOffset = offsets[i];
        const prevOffset = offsets[i - 1];

        if (nextOffset - startOffset > chunkSizeBytes + 24 && prevOffset - startOffset > 0) {
            chunks.push({ offset: startOffset, length: prevOffset - startOffset });
            startOffset = prevOffset;
            //startTimestamp = offsets[i - 1].timestamp;
        }
    }
    // Add the last chunk if it has data
    if (startOffset < offsets[offsets.length - 1]) {
        chunks.push({ offset: startOffset, length: offsets[offsets.length - 1] - startOffset });
    }

    console.timeEnd("createChunks");
    console.log("createChunks", chunks);

    return chunks;
}

// implement js function:
// export async function readPcapPacketOffsets(file, start, length);
// usage example:
// let offsets = [];
// //24 - guaranted to be start of packet
// let {newOffsetsOfFullPackets, offsetOfLastNotFullPacket} = readPcapPacketOffsets(file, 24, 1000000);


export async function readPcapPacketOffsets(file, start, length, offsetsBuffer) {
    //const offsetsBuffer = [];
    let offsetOfLastNotFullPacket = null;

    // Minimum size for a packet header (16 bytes)
    const PACKET_HEADER_SIZE = 16;

    // Determine the actual bytes to read.
    // Ensure we don't try to read beyond the file's end.
    const bytesToRead = Math.min(length, file.size - start);

    // If there's nothing to read or not even enough for a header, return early.
    if (bytesToRead <= 0) {
        return null;//{ newOffsetsOfFullPackets: [], offsetOfLastNotFullPacket: null };
    }
    if (bytesToRead < PACKET_HEADER_SIZE) {
        //return { newOffsetsOfFullPackets: [], offsetOfLastNotFullPacket: start };
        throw new Error("Too little reading size");
    }

    // Read the entire requested segment into a single ArrayBuffer
    const slice = file.slice(start, start + bytesToRead);
    const arrayBuffer = await slice.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    let relativeOffset = 0; // Offset within the current arrayBuffer (chunk)

    while (relativeOffset + PACKET_HEADER_SIZE <= bytesToRead) {
        // Read incl_len (bytes 8-11 of the packet header) from the current relative offset.
        // Assuming little-endian byte order for PCAP headers.
        const inclLen = dataView.getUint32(relativeOffset + 8, true);

        // Calculate the total size of this packet (header + data)
        const totalPacketSize = PACKET_HEADER_SIZE + inclLen;

        // Check if the entire packet (header + data) fits within the current chunk
        if (relativeOffset + totalPacketSize <= bytesToRead) {
            // Add the absolute offset to the result array
            offsetsBuffer.push(start + relativeOffset);
            relativeOffset += totalPacketSize;
        } else {
            // This packet would extend beyond the current chunk's end.
            // Mark its absolute start offset as not full and break.
            offsetOfLastNotFullPacket = start + relativeOffset;
            break;
        }
    }

    // After the loop, if we processed until the end of the chunk,
    // and there was still data remaining that wasn't enough for a full packet header,
    // that's also a 'not full' scenario.
    if (offsetOfLastNotFullPacket === null && relativeOffset <= bytesToRead) {
        // This means there were leftover bytes at the end of the chunk
        // that couldn't form a complete packet header.
        offsetOfLastNotFullPacket = start + relativeOffset;
    }

    //console.log(start + relativeOffset, relativeOffset, bytesToRead);

    return offsetOfLastNotFullPacket;//{ newOffsetsOfFullPackets: offsetsBuffer, offsetOfLastNotFullPacket };
}

export async function readPcapGlobalHeader(file) {
    const GLOBAL_HEADER_SIZE = 24;

    if (file.size < GLOBAL_HEADER_SIZE) {
        throw new Error(`File is too small (${file.size} bytes) to contain a PCAP global header (${GLOBAL_HEADER_SIZE} bytes).`);
    }

    // Read the first 24 bytes (global header) into an ArrayBuffer
    const slice = file.slice(0, GLOBAL_HEADER_SIZE);
    const arrayBuffer = await slice.arrayBuffer();
    const dv = new DataView(arrayBuffer);

    // Read the magic number first to determine byte order
    const magicNumber = dv.getUint32(0, false); // Read as big-endian first to check common values

    let isLittleEndian = isLE(magicNumber);

    // Now read the rest of the header using the determined byte order
    return {
        magicNumber: magicNumber, // Store the raw magic number
        isLittleEndian: isLittleEndian,
        versionMajor: dv.getUint16(4, isLittleEndian),
        versionMinor: dv.getUint16(6, isLittleEndian),
        timezoneOffset: dv.getInt32(8, isLittleEndian), // thiszone is signed
        timestampAccuracy: dv.getUint32(12, isLittleEndian), // sigfigs
        snapshotLength: dv.getUint32(16, isLittleEndian), // snaplen
        globalNetworkType: dv.getUint32(20, isLittleEndian) // network
    };
}