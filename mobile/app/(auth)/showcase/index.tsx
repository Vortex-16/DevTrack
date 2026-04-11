import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Modal,
  TextInput, Alert, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showcaseApi } from '../../../src/services/api';
import { useUser } from '@clerk/clerk-expo';
import {
  Share2, Star, MessageSquare, Plus, Search, Filter, X, Send, Trash2,
  Globe, Lock, Clock, TrendingUp, ExternalLink,
} from 'lucide-react-native';
import { ScreenHeader, SectionHeader, Badge, EmptyState, FullScreenLoader, Toast, Button } from '../../../src/components/ui';
import { colors, spacing, radius, fontSize, fontWeight, globalStyles } from '../../../src/theme';

// ─── Types ───────────────────────────────────────────────────────
interface ShowcaseItem {
  id: string;
  projectName?: string;
  title?: string;
  summary?: string;
  description?: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  stars?: string[] | number;
  starCount?: number;
  comments: Comment[];
  isStarred?: boolean;
  ownerName?: string;
  authorName?: string;
  ownerAvatar?: string;
  authorAvatar?: string;
  createdAt: string;
  projectId?: string;
}

interface Comment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

// ─── Showcase Card ───────────────────────────────────────────────
function ShowcaseCard({
  item, onStar, onComment, onDelete, isOwn,
}: {
  item: ShowcaseItem;
  onStar: (id: string) => void;
  onComment: (item: ShowcaseItem) => void;
  onDelete?: (id: string) => void;
  isOwn: boolean;
}) {
  const timeAgo = (dateStr: any) => {
    if (!dateStr) return 'Recently';
    const timestamp = dateStr._seconds ? dateStr._seconds * 1000 : new Date(dateStr).getTime();
    if (isNaN(timestamp)) return 'Recently';
    const diff = Date.now() - timestamp;
    const d = Math.floor(diff / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d}d ago`;
  };

  return (
    <View style={s.card}>
      {/* Author row */}
      <View style={s.cardAuthor}>
        <View style={s.authorAvatar}>
          <Text style={s.authorInitial}>{((item.ownerName || item.authorName)?.[0] ?? '?').toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.authorName}>{item.ownerName || item.authorName || 'Developer'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Clock size={10} color={colors.text.muted} />
            <Text style={s.authorTime}>{timeAgo(item.createdAt)}</Text>
          </View>
        </View>
        {isOwn && onDelete && (
          <TouchableOpacity
            onPress={() => Alert.alert('Remove', 'Remove this from Showcase?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => onDelete(item.id) },
            ])}
            style={s.deleteBtn}
          >
            <Trash2 size={14} color={colors.red.default} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={s.cardTitle}>{item.projectName || item.title}</Text>
      {(item.summary || item.description) && (
        <Text style={s.cardDesc} numberOfLines={3}>{item.summary || item.description}</Text>
      )}

      {/* Tech badges */}
      {item.technologies?.length > 0 && (
        <View style={s.techRow}>
          {item.technologies.slice(0, 4).map((t) => (
            <Badge key={t} label={t} color={colors.accent.primary} style={{ marginRight: 6, marginBottom: 4 }} />
          ))}
          {item.technologies.length > 4 && (
            <Badge label={`+${item.technologies.length - 4}`} color={colors.text.muted} />
          )}
        </View>
      )}

      {/* Footer */}
      <View style={s.cardFooter}>
        <TouchableOpacity style={s.footerBtn} onPress={() => onStar(item.id)}>
          <Star
            size={16}
            color={item.isStarred ? colors.yellow.default : colors.text.muted}
            fill={item.isStarred ? colors.yellow.default : 'none'}
          />
          <Text style={[s.footerBtnText, item.isStarred && { color: colors.yellow.default }]}>
            {item.starCount ?? (Array.isArray(item.stars) ? item.stars.length : (item.stars || 0))}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.footerBtn} onPress={() => onComment(item)}>
          <MessageSquare size={16} color={colors.text.muted} />
          <Text style={s.footerBtnText}>{item.comments?.length ?? 0}</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        {item.githubUrl && (
          <View style={s.linkChip}>
            <Globe size={12} color={colors.text.muted} />
            <Text style={s.linkChipText}>GitHub</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Comment Modal ───────────────────────────────────────────────
function CommentModal({
  visible, item, onClose, onAddComment,
}: {
  visible: boolean;
  item: ShowcaseItem | null;
  onClose: () => void;
  onAddComment: (itemId: string, content: string) => Promise<void>;
}) {
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);

  const post = async () => {
    if (!input.trim() || !item) return;
    setPosting(true);
    await onAddComment(item.id, input.trim());
    setInput('');
    setPosting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[globalStyles.screen, { paddingHorizontal: spacing.lg }]}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <X size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
        {item?.title && <Text style={s.commentProjectTitle}>{item.title}</Text>}
        <FlatList
          data={item?.comments ?? []}
          keyExtractor={(c) => c.id}
          renderItem={({ item: comment }) => (
            <View style={s.commentItem}>
              <View style={s.commentAuthorRow}>
                <View style={[s.authorAvatar, { width: 28, height: 28 }]}>
                  <Text style={[s.authorInitial, { fontSize: 10 }]}>
                    {(comment.authorName?.[0] ?? '?').toUpperCase()}
                  </Text>
                </View>
                <Text style={s.commentAuthor}>{comment.authorName || 'Guest'}</Text>
              </View>
              <Text style={s.commentContent}>{comment.content}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: spacing.xl }}>
              <MessageSquare size={32} color={colors.text.muted} />
              <Text style={{ color: colors.text.muted, marginTop: spacing.sm }}>No comments yet</Text>
            </View>
          }
          contentContainerStyle={{ flexGrow: 1 }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.commentInput}>
            <TextInput
              style={s.commentTextInput}
              value={input}
              onChangeText={setInput}
              placeholder="Write a comment..."
              placeholderTextColor={colors.text.muted}
            />
            <TouchableOpacity
              style={[s.sendBtn, (!input.trim() || posting) && { opacity: 0.4 }]}
              onPress={post}
              disabled={!input.trim() || posting}
            >
              <Send size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function ShowcaseScreen() {
  const { user } = useUser();
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'community' | 'mine'>('community');
  const [commentItem, setCommentItem] = useState<ShowcaseItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const res = tab === 'mine'
        ? await showcaseApi.getMine()
        : await showcaseApi.getAll(false, search);
      setItems(res.data?.data ?? []);
    } catch (err) {
      showToast('Failed to load showcase', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, search]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [tab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStar = async (id: string) => {
    try {
      await showcaseApi.toggleStar(id);
      setItems((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, isStarred: !p.isStarred, starCount: p.isStarred ? (p.starCount || 0) - 1 : (p.starCount || 0) + 1 }
            : p
        )
      );
    } catch (err) {
      showToast('Failed to update star', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await showcaseApi.delete(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
      showToast('Removed from showcase', 'info');
    } catch (err) {
      showToast('Failed to remove', 'error');
    }
  };

  const handleAddComment = async (itemId: string, content: string) => {
    try {
      const res = await showcaseApi.addComment(itemId, content, user?.fullName ?? 'User', user?.imageUrl);
      setItems((prev) =>
        prev.map((p) =>
          p.id === itemId
            ? { ...p, comments: [...(p.comments ?? []), res.data?.data ?? { id: Date.now().toString(), content, authorName: user?.fullName ?? 'User', createdAt: new Date().toISOString() }] }
            : p
        )
      );
    } catch (err) {
      showToast('Failed to post comment', 'error');
    }
  };

  const safeItems = Array.isArray(items) ? items : [];
  const filtered = safeItems.filter(
    (i) =>
      (i.projectName || i.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.summary || i.description || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading && safeItems.length === 0) return <FullScreenLoader />;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScreenHeader title="Showcase" subtitle="Discover developer projects" />

      {/* Tabs */}
      <View style={s.tabs}>
        {(['community', 'mine'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, tab === t && s.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'community' ? 'Community' : 'My Projects'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Search size={16} color={colors.text.muted} style={{ marginRight: spacing.sm }} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search showcase..."
          placeholderTextColor={colors.text.muted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={14} color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ShowcaseCard
            item={item}
            onStar={handleStar}
            onComment={setCommentItem}
            onDelete={tab === 'mine' ? handleDelete : undefined}
            isOwn={tab === 'mine'}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Share2 size={32} color={colors.text.muted} />}
            title={search ? 'No results' : tab === 'mine' ? 'Nothing showcased yet' : 'No projects yet'}
            subtitle={tab === 'mine' ? 'Showcase a project from the Projects screen.' : 'Check back later!'}
          />
        }
      />

      <CommentModal
        visible={!!commentItem}
        item={commentItem}
        onClose={() => setCommentItem(null)}
        onAddComment={handleAddComment}
      />

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.accent.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  cardAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.accent.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  authorInitial: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
  },
  authorName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  authorTime: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  deleteBtn: {
    padding: spacing.xs,
    backgroundColor: colors.red.bg,
    borderRadius: radius.sm,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  techRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerBtnText: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bg.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  linkChipText: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  // Modal
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  closeBtn: {
    padding: spacing.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
  },
  commentProjectTitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  commentItem: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  commentAuthor: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  commentContent: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text.primary,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
