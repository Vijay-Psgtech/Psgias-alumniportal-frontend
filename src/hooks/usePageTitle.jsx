import React, { useEffect } from "react";

const usePageTitle = (title) => {
    useEffect(() => {
        document.title = `${title} | PSG IAS ALUMNI ASSOCIATION`;
    }, [title]);
};

export default usePageTitle