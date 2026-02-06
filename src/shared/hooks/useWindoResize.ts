import { useEffect } from "react";

export const useWindowSize = (width: number, height: number): void => {

    useEffect(() => {
        if (window.lostarkAPI.resizeWindow) {
            window.lostarkAPI.resizeWindow(width, height); // UI에 맞게 높이 조정
        }
    }, [width, height]);
};
