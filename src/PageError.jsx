import { usePageHistory } from "./components/PageHistory";
import { Window } from "./components/Window"

export function PageError({ error, onBack }) {
    const { currentData } = usePageHistory();
    return (
        <Window action={"back"} onAction={onBack} className="w-[512px]"
            header={<div className="text-red-600">Error</div>} >
            <div>
                {currentData || "An unknown error occurred."}
            </div>
        </Window>
    );
}