import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * Catch-all "not found" route.
 * Clerk's OAuth callback may land on an unknown path (e.g. /oauth-native-callback
 * or /--/oauth-native-callback in Expo Go). We silently redirect to the
 * root so _layout.tsx can handle auth state and navigate appropriately.
 */
export default function NotFoundScreen() {
    const router = useRouter();

    useEffect(() => {
        // Redirect immediately – _layout.tsx handles auth-based routing
        router.replace('/');
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator size="large" color="#fff" />
        </View>
    );
}
