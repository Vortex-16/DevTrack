import React from 'react';
import { TouchableOpacity, StyleSheet, View, Animated, Platform } from 'react-native';
import { Bot, Sparkles } from 'lucide-react-native';
import { useRouter, useSegments } from 'expo-router';
import { colors, spacing, radius } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingAIChatButton() {
    const router = useRouter();
    const segments = useSegments();
    const insets = useSafeAreaInsets();
    
    // Don't show the button if we are already on the chat screen
    const isChatScreen = segments.join('/').includes('chat');
    if (isChatScreen) return null;

    const onPress = () => {
        router.push('/(auth)/chat');
    };

    return (
        <View 
            style={[
                s.container, 
                { bottom: 80 + insets.bottom } // Position above the tab bar
            ]}
            pointerEvents="box-none"
        >
            <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={onPress}
                style={s.button}
            >
                <View style={s.glow} />
                <Bot color={colors.white} size={28} />
                <View style={s.badge}>
                    <Sparkles color={colors.accent.primary} size={10} fill={colors.accent.primary} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        position: 'absolute',
        right: spacing.lg,
        zIndex: 9999,
        // Using shadow to make it pop
        ...Platform.select({
            ios: {
                shadowColor: colors.accent.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.15)',
        top: -20,
        left: -20,
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: colors.white,
        borderRadius: 6,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
