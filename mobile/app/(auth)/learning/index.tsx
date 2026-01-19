import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logsApi } from '../../../src/services/api';
import { Plus, Clock, Calendar } from 'lucide-react-native';

const LogCard = ({ log }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={styles.dateContainer}>
                <Calendar size={14} color="#888" />
                <Text style={styles.dateText}>{new Date(log.date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.hoursContainer}>
                <Clock size={14} color="#eab308" />
                <Text style={styles.hoursText}>{log.hours}h</Text>
            </View>
        </View>
        <Text style={styles.logDescription}>{log.description}</Text>
        <View style={styles.tags}>
            {log.tags?.map((tag, index) => (
                <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                </View>
            ))}
        </View>
    </View>
);

export default function Learning() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchLogs = async () => {
        try {
            const response = await logsApi.getAll();
            setLogs(response.data?.data?.logs || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchLogs();
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
                <Text style={styles.headerTitle}>Learning Log</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Plus color="#000" size={20} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={logs}
                renderItem={({ item }) => <LogCard log={item} />}
                keyExtractor={(item) => item.id || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No logs yet. Start tracking!</Text>
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#111',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#222',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        color: '#888',
        fontSize: 12,
    },
    hoursContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#eab30820',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    hoursText: {
        color: '#eab308',
        fontSize: 12,
        fontWeight: 'bold',
    },
    logDescription: {
        color: '#ddd',
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 12,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#222',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    tagText: {
        color: '#aaa',
        fontSize: 10,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#444',
    }
});
