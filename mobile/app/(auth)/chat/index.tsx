import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { geminiApi } from '../../../src/services/api';
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, fontWeight, globalStyles } from '../../../src/theme';
import { GlassCard } from '../../../src/components/ui';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const TypingIndicator = () => (
  <View style={[s.bubble, s.botBubble, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4, alignSelf: 'flex-start', marginLeft: 44 }]}>
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[s.dot]} />
      ))}
    </View>
  </View>
);

const MessageBubble = ({ message }: { message: Message }) => {
  const isBot = message.role === 'model';
  return (
    <View style={[s.messageRow, isBot ? s.botRow : s.userRow]}>
      {isBot && (
        <View style={[s.avatar, { backgroundColor: colors.accent.primary + '30' }]}>
          <Bot size={14} color={colors.accent.primary} />
        </View>
      )}
      <View style={[s.bubble, isBot ? s.botBubble : s.userBubble]}>
        <Text style={[s.msgText, isBot ? { color: colors.text.primary } : { color: colors.white }]}>
          {message.text}
        </Text>
        <Text style={[s.timestamp, { color: isBot ? colors.text.muted : 'rgba(255,255,255,0.5)' }]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'model',
      text: "Hi! I'm your AI DevTrack assistant powered by Gemini. I can help you analyze projects, write READMEs, suggest improvements, or answer any coding questions. What would you like to explore today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const SUGGESTIONS = [
    'Analyze my recent projects',
    'Suggest a new project idea',
    'Help me write a README',
    'Review my tech stack',
  ];

  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: msgText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await geminiApi.chat(msgText, '');
      const replyText =
        res.data?.data?.message ||
        res.data?.data?.reply ||
        res.data?.message ||
        'I could not generate a reply right now.';
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: replyText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: '❌ Failed to connect to AI service. Please check your connection.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear the conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setMessages([
            {
              id: '0',
              role: 'model',
              text: "Chat cleared! How can I help you?",
              timestamp: new Date(),
            },
          ]);
        },
      },
    ]);
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const showSuggestions = messages.length <= 1;

  return (
    <SafeAreaView style={globalStyles.screen}>
      {/* ── Header ── */}
      <GlassCard style={s.headerCard} contentStyle={s.header} intensity={28}>
        <View style={s.aiIndicator}>
          <Sparkles size={16} color={colors.accent.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>AI Assistant</Text>
          <Text style={s.headerSub}>Powered by Gemini</Text>
        </View>
        <TouchableOpacity style={s.clearBtn} onPress={clearChat}>
          <Trash2 size={18} color={colors.text.muted} />
        </TouchableOpacity>
      </GlassCard>

      {/* ── Messages ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        ListFooterComponent={
          loading ? (
            <View style={[s.messageRow, s.botRow]}>
              <View style={[s.avatar, { backgroundColor: colors.accent.primary + '30' }]}>
                <Bot size={14} color={colors.accent.primary} />
              </View>
              <TypingIndicator />
            </View>
          ) : null
        }
      />

      {/* ── Suggestions ── */}
      {showSuggestions && (
        <View style={s.suggestionsRow}>
          {SUGGESTIONS.map((s) => (
            <GlassCard key={s} style={s2.suggestionCard} contentStyle={s2.suggestionCardContent} intensity={18} radiusSize={9999}>
              <TouchableOpacity style={s2.suggestionChip} onPress={() => sendMessage(s)}>
                <Text style={s2.suggestionText}>{s}</Text>
              </TouchableOpacity>
            </GlassCard>
          ))}
        </View>
      )}

      {/* ── Input ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <GlassCard style={s.inputCard} contentStyle={s.inputBar} intensity={32}>
          <TextInput
            style={s.textInput}
            placeholder="Ask anything about your projects..."
            placeholderTextColor={colors.text.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Send size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        </GlassCard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  headerCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  aiIndicator: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.accent.glow,
    borderWidth: 1,
    borderColor: colors.accent.primary + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerSub: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  clearBtn: {
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  botRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.bg.border,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: colors.accent.primary,
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text.muted,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  suggestionCard: {
    borderRadius: 9999,
  },
  suggestionCardContent: {
    borderRadius: 9999,
  },
  inputCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 28,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: colors.text.primary,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const s2 = StyleSheet.create({
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  suggestionText: {
    fontSize: fontSize.xs,
    color: colors.accent.primaryLight,
    fontWeight: fontWeight.medium,
  },
});
