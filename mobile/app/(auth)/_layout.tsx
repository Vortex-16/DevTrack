import { Tabs } from 'expo-router';
import { Home, Folder, BookOpen, Share2, Bot } from 'lucide-react-native';

export default function AuthLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#000',
                    borderTopColor: '#333',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#fff',
                tabBarInactiveTintColor: '#666',
                tabBarShowLabel: true,
            }}
        >
            <Tabs.Screen
                name="dashboard/index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="projects/index"
                options={{
                    title: 'Projects',
                    tabBarIcon: ({ color, size }) => <Folder color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="learning/index"
                options={{
                    title: 'Learning',
                    tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="chat/index"
                options={{
                    title: 'AI Chat',
                    tabBarIcon: ({ color, size }) => <Bot color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="showcase/index"
                options={{
                    title: 'Showcase',
                    tabBarIcon: ({ color, size }) => <Share2 color={color} size={size} />,
                }}
            />
        </Tabs>
    );
}
