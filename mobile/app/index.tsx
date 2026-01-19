import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth } from '@clerk/clerk-expo';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useWarmUpBrowser } from '../src/hooks/useWarmUpBrowser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Github } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    useWarmUpBrowser();

    const { startOAuthFlow } = useOAuth({ strategy: 'oauth_github' });

    const onSignIn = async () => {
        try {
            const { createdSessionId, setActive } = await startOAuthFlow();
            if (createdSessionId && setActive) {
                setActive({ session: createdSessionId });
            }
        } catch (err) {
            console.error('OAuth error', err);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Image
                        source={require('../assets/DevTrack.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>DevTrack</Text>
                    <Text style={styles.subtitle}>Track your developer journey</Text>
                </View>

                <TouchableOpacity style={styles.button} onPress={onSignIn}>
                    <Github color="#000" size={24} style={styles.icon} />
                    <Text style={styles.buttonText}>Sign in with GitHub</Text>
                </TouchableOpacity>

                <Text style={styles.footer}>
                    By continuing, you agree to our Terms and Privacy Policy.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 24,
        borderRadius: 24,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: '#888',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 32,
    },
    icon: {
        marginRight: 12,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    footer: {
        textAlign: 'center',
        color: '#666',
        fontSize: 12,
    },
});
