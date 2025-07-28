export function Button({ onClick, children }) {
    return (
        <button onClick={onClick} className='rounded-xs outline-none 
        focus:ring-4 focus:ring-blue-300/50 select-none
        p-2 bg-blue-600 text-white cursor-pointer border-blue-50 '>
            {children}
        </button>
    )
}

export function TxtButton({ onClick, children, ...props }) {
    return (
        <button onClick={onClick} className='outline-none 
         select-none
        disabled:text-neutral-500/50 disabled:cursor-default
        focus:ring-[6px] focus:bg-blue-300/10 focus:font-bold focus:ring-blue-300/10 focus:animate-pulse 
        text-blue-600 cursor-pointer ' {...props}>
            [{children}]
        </button>
    )
}