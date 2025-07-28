export function bytesToString(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    else if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
    else return `${(bytes / 1073741824).toFixed(2)} GB`;
}
export function numToThousands(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function toZeroLeadIndex(index, maxIndex) {
    const maxIndexStrLength = maxIndex.toString().length;
    const indexStr = index.toString().padStart(maxIndexStrLength, '0');
    return indexStr
}

export function generateChunkName(filename, index, maxIndex) {
    const indexStr = toZeroLeadIndex(index, maxIndex);
    const originalShortFilename = filename.replace(/\.pcap$/, '');
    return `${originalShortFilename}_${indexStr}.pcap`;
}
