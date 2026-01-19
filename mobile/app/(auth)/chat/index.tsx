import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { geminiApi } from '../../../src/services/api';
import { Send, Bot, User, Trash2 } from 'lucide-react-native';

const MessageBubble = ({ message }) => {
    const isBot = message.role === 'model';
    return (
        <View style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}>
            {isBot && (
                <View style={styles.avatarContainer}>
                    <Bot size={16} color="#fff" />
                </View>
            )}
            <View style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}>
                <Text style={[styles.messageText, { color: isBot ? '#fff' : '#000' }]}>{message.text}</Text>
            </View>
            {!isBot && (
                <View style={styles.avatarContainer}>
                    <User size={16} color="#000" />
                </View>
            )}
        </View>
    );
};

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);

    const fetchHistory = async () => {
        try {
            const response = await geminiApi.getHistory();
            if (response.data && response.data.data && response.data.data.history) {
                // Formatting might be needed depending on API response structure
                // Assuming API returns { history: [{ role: 'user', parts: [{ text: '...' }] }] }
                // Adapting to simple structure for UI
                const formatted = response.data.data.history.map(item => ({
                    role: item.role,
                    text: item.content || ''
                }));
                // setMessages(formatted);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    useEffect(() => {
        // fetchHistory(); // Optional: load history on mount
        // Add welcome message
        setMessages([{ role: 'model', text: 'Hi! I am your AI assistant. How can I help you with your projects today?' }]);
    }, []);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await geminiApi.chat(input, ''); // context string for now
            const botMsg = { role: 'model', text: response.data.data.message || 'Sorry, I realized I could not answer that.' };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Error: Could not connect to AI service.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>AI Assistant</Text>
                <TouchableOpacity onPress={() => setMessages([])}>
                    <Trash2 size={20} color="#666" />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={({ item }) => <MessageBubble message={item} />}
                keyExtractor={(_, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Ask anything..."
                    placeholderTextColor="#666"
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                    onPress={sendMessage}
                    disabled={!input.trim()}
                >
                    {loading ? <ActivityIndicator size="small" color="#000" /> : <Send size={20} color="#000" />}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    botRow: {
        justifyContent: 'flex-start',
    },
    userRow: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    bubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
    },
    botBubble: {
        backgroundColor: '#222',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: '#fff',
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        color: '#fff', // userBubble overrides this logic via style usually, need fixing
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#222',
        backgroundColor: '#000',
    },
    input: {
        flex: 1,
        backgroundColor: '#111',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        color: '#fff',
        marginRight: 12,
        fontSize: 16,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
});
