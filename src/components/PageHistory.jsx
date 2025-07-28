import { useCallback, useEffect, useState } from "react";

export const usePageHistory = () => {
    const [currentPage, setCurrentPage] = useState(window.history.state?.page ? window.history.state.page : 'start');
    const [currentData, setCurrentData] = useState(window.history.state?.data ? window.history.state.data : null);
    useEffect(() => {
        const handlePopState = (event) => {
            const newPage = (event.state && event.state.page) ? event.state.page : 'start';
            const newData = (event.state && event.state.data) ? event.state.data : null;
            console.log("usePageHistory.handlePopState", newPage, newData)
            setCurrentPage(newPage); // Update internal hook state
            setCurrentData(newData);
        };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const pushPage = useCallback((pageName, data) => {
        console.log("usePageHistory.pushPage", pageName, data)
        window.history.pushState({ page: pageName }, null);
        setCurrentPage(pageName);
        setCurrentData(data);
    }, []);

    const replacePage = useCallback((pageName, data) => {
        console.log("usePageHistory.replacePage", pageName, data)
        window.history.replaceState({ page: pageName, data: data }, null);
        setCurrentPage(pageName);
        setCurrentData(data);
    }, []);

    const goBack = useCallback(() => {
        window.history.back();
    }, []);


    return { currentPage, currentData, pushPage, replacePage, goBack };
};
