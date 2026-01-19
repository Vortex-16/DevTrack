import { useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

export const useWarmUpBrowser = () => {
    useEffect(() => {
        if (Platform.OS === "android") {
            void WebBrowser.warmUpAsync();
            return () => {
                void WebBrowser.coolDownAsync();
            };
        }
    }, []);
};
