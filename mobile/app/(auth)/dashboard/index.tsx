import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { projectsApi, githubApi } from '../../../src/services/api';
import { Folder, GitCommit, Star, Activity, LogOut } from 'lucide-react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';

const StatCard = ({ icon: Icon, label, value, color }) => (
    <View style={styles.statCard}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Icon color={color} size={24} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);

export default function Dashboard() {
    const { user } = useUser();
    const { signOut } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const onSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const fetchData = async () => {
        try {
            // Parallel fetch similar to web
            const [projectsStats, githubStats] = await Promise.all([
                projectsApi.getStats().catch(err => {
                    console.error('Projects Stats Error:', err);
                    return { data: { data: { totalProjects: 0, totalCommits: 0, activeProjects: 0 } } };
                }),
                githubApi.getProfile().catch(err => {
                    console.error('GitHub Profile Error:', err);
                    return { data: { data: { public_repos: 0, followers: 0 } } };
                })
            ]);

            console.log('📊 Projects Stats:', projectsStats.data);
            console.log('👤 GitHub Stats:', githubStats.data);

            setStats({
                projects: projectsStats.data?.data?.totalProjects ?? 0,
                repos: githubStats.data?.data?.public_repos ?? 0,
                followers: githubStats.data?.data?.followers ?? 0,
                // Removed mock data. Future: fetch contributions from API
                contributions: projectsStats.data?.data?.totalCommits ?? 'N/A',
                streak: projectsStats.data?.data?.activeProjects ?? 0,
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.username}>{user?.firstName ? String(user.firstName) : 'Developer'}</Text>
                </View>
                <TouchableOpacity onPress={onSignOut} style={styles.signOutButton}>
                    <LogOut color="#ef4444" size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                <View style={styles.grid}>
                    <StatCard
                        icon={Folder}
                        label="Total Projects"
                        value={stats?.projects}
                        color="#3b82f6"
                    />
                    <StatCard
                        icon={GitCommit}
                        label="Repositories"
                        value={stats?.repos}
                        color="#8b5cf6"
                    />
                    <StatCard
                        icon={Star}
                        label="Followers"
                        value={stats?.followers}
                        color="#eab308"
                    />
                    <StatCard
                        icon={Activity}
                        label="Current Streak"
                        value={stats?.streak}
                        color="#22c55e"
                    />
                </View>

                {/* Additional sections can be added here (Activity Graph, Recent Projects) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    {/* Placeholder for quick actions */}
                    <View style={styles.placeholderBox}>
                        <Text style={styles.placeholderText}>Start a new project</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 12,
    },
    signOutButton: {
        padding: 8,
        backgroundColor: '#222',
        borderRadius: 12,
    },
    greeting: {
        fontSize: 16,
        color: '#888',
    },
    username: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 24,
        paddingTop: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#222',
        flexDirection: 'column',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
    },
    placeholderBox: {
        backgroundColor: '#111',
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    placeholderText: {
        color: '#444',
    }
});
