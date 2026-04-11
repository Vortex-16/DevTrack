import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { setTokenProvider, authApi } from '../src/services/api';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const publishableKey = 'pk_test_aGlwLXNlYWwtODQuY2xlcmsuYWNjb3VudHMuZGV2JA';

const tokenCache = {
    async getToken(key: string) {
        try {
            return SecureStore.getItemAsync(key);
        } catch (err) {
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            return SecureStore.setItemAsync(key, value);
        } catch (err) {
            return;
        }
    },
};

const InitialLayout = () => {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isLoaded) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (isSignedIn && !inAuthGroup) {
            // Register the dynamic token provider directly
            setTokenProvider(getToken);

            // Navigate immediately to the dashboard for a snappier feel
            router.replace('/(auth)/dashboard');

            // Sync in the background – don't block the UI
            const syncInBackground = async () => {
                const token = await getToken();
                if (token) {
                    try {
                        await authApi.sync();
                        console.log('✅ Background sync complete');
                    } catch (error) {
                        console.error('❌ Background sync failed:', error);
                    }
                }
            };
            syncInBackground();
        } else if (!isSignedIn && inAuthGroup) {
            router.replace('/');
        }
    }, [isSignedIn, isLoaded, segments]);

    if (!isLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return <Slot />;
};

export default function RootLayout() {
    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
            <ClerkLoaded>
                <SafeAreaProvider>
                    <InitialLayout />
                </SafeAreaProvider>
            </ClerkLoaded>
        </ClerkProvider>
    );
}
