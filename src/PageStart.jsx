import { useState, useRef } from 'react';
import { Window } from "./components/Window"

export function PageStart({ onPick }) {
    const [isDragging, setIsDragging] = useState(false); // State to indicate if a file is being dragged over the area
    const fileInputRef = useRef(null);                 // Ref to access the hidden file input element

    // Function to handle file processing
    const handleFile = (file) => {
        if (file) {
            console.log('File picked:', file.name); // Print filename to console
            if (onPick && typeof onPick === 'function') {
                onPick(file); // Call the onPick event with the selected file
            }
        }
    };

    // Event handler for when a file is dragged over the drop zone
    const handleDragOver = (event) => {
        event.preventDefault(); // Prevent default behavior (e.g., opening file in new tab)
        setIsDragging(true);    // Set dragging state to true for visual feedback
    };

    // Event handler for when a dragged file enters the drop zone
    const handleDragEnter = (event) => {
        event.preventDefault(); // Prevent default behavior
        setIsDragging(true);    // Set dragging state to true
    };

    // Event handler for when a dragged file leaves the drop zone
    const handleDragLeave = (event) => {
        event.preventDefault(); // Prevent default behavior
        setIsDragging(false);   // Set dragging state to false
    };

    // Event handler for when a file is dropped onto the drop zone
    const handleDrop = (event) => {
        event.preventDefault(); // Prevent default behavior
        setIsDragging(false);   // Reset dragging state

        // Check if files were dropped
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            handleFile(event.dataTransfer.files[0]); // Process the first dropped file
            event.dataTransfer.clearData();         // Clear data after processing
        }
    };

    // Event handler for when a file is selected via the input field
    const handleFileInputChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            handleFile(event.target.files[0]); // Process the first selected file
        }
    };

    // Function to trigger the hidden file input click
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (

        <Window header="" action="click to browse"
            onAction={triggerFileInput}
            className={["w-[512px] ring-white/0 ring", isDragging && ' bg-blue-100  ring-blue-300/50 shadow-none ring-4 ']}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}>

            <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" accept="*" />
            Drag & Drop *.pcap file here<br />
            Average processing speed: 500 MB/s<br />
            File will be processed localy
        </Window>

    );
}