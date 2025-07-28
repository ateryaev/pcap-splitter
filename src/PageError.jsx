import { usePageHistory } from "./components/PageHistory";
import { Window } from "./components/Window"

export function PageError({ error, onBack }) {
    const { currentData } = usePageHistory();
    return (
        <Window action={"back"} onAction={onBack} className="w-[512px]">
            {/* <div className="text-red-600">Error</div> */}
            <div className="bg-neutral-200 font-bold text-red-600 px-6 pt-6 -m-4 -mx-6">
                Error: {currentData || "An unknown error occurred."}
            </div>
        </Window>
    );
}