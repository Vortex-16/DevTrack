import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showcaseApi } from '../../../src/services/api';
import { Heart, MessageSquare, ExternalLink } from 'lucide-react-native';

const ShowcaseCard = ({ item }) => (
    <View style={styles.card}>
        {/* Placeholder for image if one existed, using a gradient-like view for now */}
        <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>🚀</Text>
        </View>

        <View style={styles.cardContent}>
            <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.authorName}>by {item.authorName || 'Anonymous'}</Text>
            <Text style={styles.projectDesc} numberOfLines={2}>{item.description}</Text>

            <View style={styles.cardFooter}>
                <View style={styles.action}>
                    <Heart size={16} color={item.isLiked ? '#ef4444' : '#666'} />
                    <Text style={styles.actionText}>{item.likes || 0}</Text>
                </View>
                <View style={styles.action}>
                    <MessageSquare size={16} color="#666" />
                    <Text style={styles.actionText}>{item.comments?.length || 0}</Text>
                </View>
            </View>
        </View>
    </View>
);

export default function Showcase() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchShowcase = async () => {
        try {
            const response = await showcaseApi.getAll();
            setItems(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching showcase:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchShowcase();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchShowcase();
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
                <Text style={styles.headerTitle}>Showcase</Text>
            </View>

            <FlatList
                data={items}
                renderItem={({ item }) => <ShowcaseCard item={item} />}
                keyExtractor={(item) => item.id || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={onRefresh}
                numColumns={1}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No showcased projects yet.</Text>
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
        padding: 24,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#222',
    },
    imagePlaceholder: {
        height: 120,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderIcon: {
        fontSize: 40,
    },
    cardContent: {
        padding: 16,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    authorName: {
        fontSize: 12,
        color: '#888',
        marginBottom: 8,
    },
    projectDesc: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 20,
    },
    action: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
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
