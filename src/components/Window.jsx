import { cn } from "../utils/cn";
import { Button } from "./Button";

export function Window({ header, action, onAction, children, className, ...props }) {
    return (
        <div
            className={cn("w-[768px] max-w-full m-4x bg-neutral-300 shadow flex flex-col xgap-px", className)}
            {...props}>
            {header && <div className="p-6 py-4 bg-neutral-200 border-bs border-neutral-300 xtext-white">
                {header}
            </div>}
            <div className="p-6 py-4 bg-neutral-50 border-bs border-neutral-300 xtext-white">
                {children}
            </div>
            <div className="p-4 flex w-full flex-col bg-neutral-200 ">
                <Button onClick={onAction}>{action}</Button>
            </div>
        </div>
    );
}