import { Tabs, useSegments } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Home, Folder, BookOpen, Share2, Bot, Settings } from 'lucide-react-native';
import { View } from 'react-native';
import { colors, radius, spacing } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingAIChatButton } from '../../src/components/chat/FloatingAIChatButton';

export default function AuthLayout() {
    const insets = useSafeAreaInsets();
    const segments = useSegments();
    const isChatScreen = segments.join('/').includes('chat');
    const TAB_BAR_HEIGHT = 60 + insets.bottom;

    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarBackground: () => (
                        <BlurView intensity={58} tint="dark" style={{ flex: 1 }} />
                    ),
                    tabBarStyle: {
                        display: isChatScreen ? 'none' : 'flex',
                        position: 'absolute',
                        left: spacing.lg,
                        right: spacing.lg,
                        bottom: insets.bottom > 0 ? insets.bottom : spacing.md,
                        borderTopWidth: 0,
                        backgroundColor: 'rgba(22,26,34,0.52)',
                        borderRadius: 9999,
                        height: TAB_BAR_HEIGHT,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                        paddingTop: 7,
                        paddingHorizontal: spacing.sm,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.16)',
                        elevation: 16,
                        shadowColor: '#000',
                        shadowOpacity: 0.3,
                        shadowRadius: 24,
                        shadowOffset: { width: 0, height: 12 },
                    },
                    tabBarActiveTintColor: colors.accent.primary,
                    tabBarInactiveTintColor: colors.text.muted,
                    tabBarShowLabel: true,
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                        marginTop: 2,
                    },
                    tabBarItemStyle: {
                        borderRadius: radius.md,
                        marginHorizontal: 0,
                        marginVertical: 2,
                    },
                }}
            >
                <Tabs.Screen
                    name="dashboard/index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
                    }}
                />
                <Tabs.Screen
                    name="projects/index"
                    options={{
                        title: 'Projects',
                        tabBarIcon: ({ color, size }) => <Folder color={color} size={size - 2} />,
                    }}
                />
                <Tabs.Screen
                    name="learning/index"
                    options={{
                        title: 'Learning',
                        tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size - 2} />,
                    }}
                />
                <Tabs.Screen
                    name="showcase/index"
                    options={{
                        title: 'Showcase',
                        tabBarIcon: ({ color, size }) => <Share2 color={color} size={size - 2} />,
                    }}
                />
                <Tabs.Screen
                    name="settings/index"
                    options={{
                        title: 'Settings',
                        tabBarIcon: ({ color, size }) => <Settings color={color} size={size - 2} />,
                    }}
                />
                {/* Hidden screens - accessible via navigation but not shown in tab bar */}
                <Tabs.Screen
                    name="chat/index"
                    options={{
                        href: null, // hidden from tab bar
                        title: 'AI Chat',
                    }}
                />
                <Tabs.Screen
                    name="github-insights/index"
                    options={{
                        href: null, // hidden from tab bar
                        title: 'GitHub',
                    }}
                />
                <Tabs.Screen
                    name="resume/index"
                    options={{
                        href: null, // hidden from tab bar
                        title: 'Resume',
                    }}
                />
            </Tabs>
            <FloatingAIChatButton />
        </View>
    );
}

