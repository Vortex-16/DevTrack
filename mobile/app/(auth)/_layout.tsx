import { Tabs } from 'expo-router';
import { Home, Folder, BookOpen, Share2, Bot, Settings } from 'lucide-react-native';
import { colors, radius, spacing } from '../../src/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AuthLayout() {
    const insets = useSafeAreaInsets();
    const TAB_BAR_HEIGHT = 60 + insets.bottom;

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.bg.secondary,
                    borderTopColor: colors.bg.border,
                    borderTopWidth: 1,
                    height: TAB_BAR_HEIGHT,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
                    paddingTop: 8,
                    paddingHorizontal: spacing.md,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: colors.accent.primary,
                tabBarInactiveTintColor: colors.text.muted,
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    marginTop: 2,
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
                name="chat/index"
                options={{
                    title: 'AI Chat',
                    tabBarIcon: ({ color, size }) => <Bot color={color} size={size - 2} />,
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
    );
}
