import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { githubApi, projectsApi } from '../../../src/services/api';
import { Plus, GitMerge, Star, Code } from 'lucide-react-native';
import { useAuth } from '@clerk/clerk-expo';

const ProjectCard = ({ project }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{project.name}</Text>
            {project.private ? (
                <View style={styles.badgePrivate}><Text style={styles.badgeText}>Private</Text></View>
            ) : (
                <View style={styles.badgePublic}><Text style={styles.badgeText}>Public</Text></View>
            )}
        </View>
        <Text style={styles.cardDesc} numberOfLines={2}>{project.description || 'No description provided'}</Text>

        <View style={styles.cardFooter}>
            <View style={styles.stat}>
                <Code size={14} color="#888" />
                <Text style={styles.statText}>{project.language || 'N/A'}</Text>
            </View>
            <View style={styles.stat}>
                <Star size={14} color="#eab308" />
                <Text style={styles.statText}>{project.stargazers_count || 0}</Text>
            </View>
            <View style={styles.stat}>
                <GitMerge size={14} color="#8b5cf6" />
                <Text style={styles.statText}>{project.forks_count || 0}</Text>
            </View>
        </View>
    </View>
);

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Auto-fetch logic identical to web: Get GitHub repos
    const fetchProjects = async () => {
        try {
            const response = await githubApi.getRepos(100);
            setProjects(response.data?.data?.repos || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProjects();
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
                <Text style={styles.headerTitle}>Projects</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => alert('Project creation is available on the web version.')}
                >
                    <Plus color="#000" size={20} />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={projects}
                renderItem={({ item }) => <ProjectCard project={item} />}
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No projects found.</Text>
                    </View>
                }
            />
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
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addButtonText: {
        color: '#000',
        fontWeight: '600',
        marginLeft: 4,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#222',
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        marginRight: 8,
    },
    badgePrivate: {
        backgroundColor: '#222',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgePublic: {
        backgroundColor: '#166534',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    cardDesc: {
        color: '#888',
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#666',
        fontSize: 12,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#444',
    }
});
