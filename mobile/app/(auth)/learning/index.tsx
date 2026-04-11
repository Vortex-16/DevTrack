import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
  Modal, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logsApi, tasksApi, goalsApi } from '../../../src/services/api';
import {
  Plus, BookOpen, Clock, Calendar, Target, CheckCircle2, Circle,
  X, ChevronRight, Trash2, Edit3, BarChart2,
} from 'lucide-react-native';
import { ScreenHeader, SectionHeader, Badge, EmptyState, FullScreenLoader, Toast, Button } from '../../../src/components/ui';
import { colors, spacing, radius, fontSize, fontWeight, globalStyles } from '../../../src/theme';

// ─── Types ───────────────────────────────────────────────────────
interface Log {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  learnedToday: string;
  tags?: string[];
  mood?: string;
}
interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}
interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────
const formatDate = (date: any) => {
  if (!date) return '---';
  try {
    const d = date?._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return isNaN(d.getTime()) ? '---' : d.toLocaleDateString();
  } catch {
    return '---';
  }
};

// ─── Log Card ────────────────────────────────────────────────────
function LogCard({ log, onDelete }: { log: Log; onDelete: (id: string) => void }) {
  return (
    <View style={s.card}>
      <View style={s.cardRow}>
        <View style={s.logIconBox}>
          <BookOpen size={16} color={colors.accent.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.logDesc} numberOfLines={2}>{log.learnedToday}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color={colors.text.muted} />
              <Text style={s.logMeta}>{formatDate(log.date)}</Text>
            </View>
            {log.mood && (
              <View style={[s.hoursChip, { backgroundColor: colors.yellow.bg }]}>
                <Text style={[s.logMeta, { color: colors.yellow.default, fontWeight: fontWeight.bold }]}>{log.mood}</Text>
              </View>
            )}
          </View>
          {log.tags && log.tags.length > 0 && (
            <View style={s.tagsRow}>
              {log.tags.map((t) => (
                <Badge key={t} label={`#${t}`} color={colors.text.muted} style={{ marginRight: 4, marginTop: 4 }} />
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert('Delete Log', 'Delete this log entry?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(log.id) },
          ])}
          style={s.deleteBtn}
        >
          <Trash2 size={13} color={colors.red.default} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Task Item ───────────────────────────────────────────────────
function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const priorityColor = { high: colors.red.default, medium: colors.yellow.default, low: colors.green.default }[task.priority ?? 'low'];
  return (
    <View style={s.taskRow}>
      <TouchableOpacity onPress={() => onToggle(task.id)} style={s.taskCheck}>
        {task.completed
          ? <CheckCircle2 size={22} color={colors.green.default} />
          : <Circle size={22} color={colors.text.muted} />
        }
      </TouchableOpacity>
      <Text style={[s.taskTitle, task.completed && s.taskDone]} numberOfLines={1}>{task.title}</Text>
      {task.priority && (
        <View style={[s.priorityDot, { backgroundColor: priorityColor }]} />
      )}
      <TouchableOpacity onPress={() => onDelete(task.id)} style={s.deleteBtn}>
        <Trash2 size={13} color={colors.text.muted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Goal Card ───────────────────────────────────────────────────
function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: string) => void }) {
  const prog = goal.progress ?? 0;
  return (
    <View style={s.goalCard}>
      <View style={s.goalHeader}>
        <Target size={16} color={colors.accent.primary} style={{ marginRight: spacing.sm }} />
        <Text style={s.goalTitle}>{goal.title}</Text>
        <TouchableOpacity onPress={() => onDelete(goal.id)} style={s.deleteBtn}>
          <Trash2 size={13} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
      {goal.description && <Text style={s.goalDesc}>{goal.description}</Text>}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${prog}%` }]} />
      </View>
      <Text style={s.progressText}>{prog}% complete</Text>
    </View>
  );
}

// ─── Log Modal ───────────────────────────────────────────────────
function LogModal({ visible, onClose, onSave, saving }: { visible: boolean; onClose: () => void; onSave: (d: Partial<Log>) => Promise<void>; saving: boolean }) {
  const [learnedToday, setLearnedToday] = useState('');
  const [mood, setMood] = useState('good');
  const [tags, setTags] = useState('');

  const reset = () => { setLearnedToday(''); setTags(''); setMood('good'); };

  const save = async () => {
    if (!learnedToday.trim()) return Alert.alert('Error', 'Description is required');
    const now = new Date();
    // Simulate a 1 hour session ending now to satisfy the backend
    const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    
    await onSave({ 
      learnedToday: learnedToday.trim(), 
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [], 
      date: now.toISOString(),
      startTime: start,
      endTime: now.toISOString(),
      mood: mood
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={[globalStyles.screen, { paddingHorizontal: spacing.lg }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Log Learning Time</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }} style={s.closeBtn}>
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <Text style={s.fieldLabel}>What did you learn? *</Text>
            <TextInput style={[globalStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={learnedToday} onChangeText={setLearnedToday} multiline
              placeholder="Describe what you studied or built..." placeholderTextColor={colors.text.muted} />
            <Text style={s.fieldLabel}>Mood</Text>
            <TextInput style={globalStyles.input} value={mood} onChangeText={setMood}
              placeholder="e.g. good, bad, productive" placeholderTextColor={colors.text.muted} />
            <Text style={s.fieldLabel}>Tags (comma separated)</Text>
            <TextInput style={globalStyles.input} value={tags} onChangeText={setTags}
              placeholder="react, typescript, backend..." placeholderTextColor={colors.text.muted} />
            <View style={{ height: spacing.xl }} />
            <Button label="Save Log" onPress={save} loading={saving} />
            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function LearningScreen() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'tasks' | 'goals'>('logs');
  const [logModal, setLogModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [newTask, setNewTask] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [logsRes, tasksRes, goalsRes] = await Promise.allSettled([
        logsApi.getAll({}),
        tasksApi.getAll({}),
        goalsApi.getAll(),
      ]);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value?.data?.data?.logs ?? logsRes.value?.data?.data ?? []);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value?.data?.data ?? []);
      if (goalsRes.status === 'fulfilled') setGoals(goalsRes.value?.data?.data ?? []);
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { setLoading(true); fetchAll(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchAll(); };

  const saveLog = async (data: Partial<Log>) => {
    setSaving(true);
    try {
      const res = await logsApi.create(data);
      setLogs((prev) => [res.data?.data ?? { id: Date.now().toString(), ...data } as Log, ...prev]);
      setLogModal(false);
      showToast('Log saved!', 'success');
    } catch { showToast('Failed to save log', 'error'); }
    finally { setSaving(false); }
  };

  const deleteLog = async (id: string) => {
    try {
      await logsApi.delete(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      showToast('Log deleted', 'info');
    } catch { showToast('Failed to delete', 'error'); }
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await tasksApi.create({ title: newTask.trim() });
      setTasks((prev) => [...prev, res.data?.data ?? { id: Date.now().toString(), title: newTask, completed: false }]);
      setNewTask('');
    } catch { showToast('Failed to add task', 'error'); }
  };

  const toggleTask = async (id: string) => {
    try {
      await tasksApi.toggle(id);
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
    } catch { showToast('Failed to update task', 'error'); }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch { showToast('Failed to delete task', 'error'); }
  };

  const addGoal = async () => {
    if (!newGoal.trim()) return;
    try {
      const res = await goalsApi.create({ title: newGoal.trim() });
      setGoals((prev) => [...prev, res.data?.data ?? { id: Date.now().toString(), title: newGoal }]);
      setNewGoal('');
    } catch { showToast('Failed to add goal', 'error'); }
  };

  const deleteGoal = async (id: string) => {
    try {
      await goalsApi.delete(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch { showToast('Failed to delete goal', 'error'); }
  };

  const safeLogs = Array.isArray(logs) ? logs : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeGoals = Array.isArray(goals) ? goals : [];

  const completedTasks = safeTasks.filter((t) => t.completed).length;

  if (loading) return <FullScreenLoader />;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScreenHeader
        title="Learning"
        subtitle={`${safeLogs.length} sessions logged`}
        right={
          activeTab === 'logs' ? (
            <TouchableOpacity style={s.addBtn} onPress={() => setLogModal(true)}>
              <Plus size={20} color={colors.white} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Stats Strip */}
      <View style={s.statsStrip}>
        <View style={s.statItem}>
          <Text style={s.statNum}>{safeLogs.length}</Text>
          <Text style={s.statLabel}>Logs</Text>
        </View>

        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statNum}>{completedTasks}/{safeTasks.length}</Text>
          <Text style={s.statLabel}>Tasks</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statNum}>{safeGoals.length}</Text>
          <Text style={s.statLabel}>Goals</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['logs', 'tasks', 'goals'] as const).map((t) => (
          <TouchableOpacity key={t} style={[s.tab, activeTab === t && s.tabActive]} onPress={() => setActiveTab(t)}>
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
      >
        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <>
            {safeLogs.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={32} color={colors.text.muted} />}
                title="No Logs Yet"
                subtitle="Start logging your learning sessions."
                action={{ label: 'Add Log', onPress: () => setLogModal(true) }}
              />
            ) : (
              safeLogs.map((log) => <LogCard key={log.id} log={log} onDelete={deleteLog} />)
            )}
          </>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <>
            <View style={s.addRow}>
              <TextInput
                style={[globalStyles.input, { flex: 1, marginRight: spacing.sm }]}
                value={newTask}
                onChangeText={setNewTask}
                placeholder="Add a task..."
                placeholderTextColor={colors.text.muted}
                onSubmitEditing={addTask}
              />
              <TouchableOpacity style={s.addBtn} onPress={addTask}>
                <Plus size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
            {safeTasks.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={32} color={colors.text.muted} />}
                title="No Tasks"
                subtitle="Add tasks to stay on track."
              />
            ) : (
              safeTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))
            )}
          </>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <>
            <View style={s.addRow}>
              <TextInput
                style={[globalStyles.input, { flex: 1, marginRight: spacing.sm }]}
                value={newGoal}
                onChangeText={setNewGoal}
                placeholder="Add a goal..."
                placeholderTextColor={colors.text.muted}
                onSubmitEditing={addGoal}
              />
              <TouchableOpacity style={s.addBtn} onPress={addGoal}>
                <Plus size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
            {safeGoals.length === 0 ? (
              <EmptyState
                icon={<Target size={32} color={colors.text.muted} />}
                title="No Goals Set"
                subtitle="Define your learning goals here."
              />
            ) : (
              safeGoals.map((goal) => <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} />)
            )}
          </>
        )}
      </ScrollView>

      <LogModal visible={logModal} onClose={() => setLogModal(false)} onSave={saveLog} saving={saving} />
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
  statLabel: { fontSize: fontSize.xs, color: colors.text.muted },
  statDivider: { width: 1, height: 30, backgroundColor: colors.bg.border },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.accent.primary },
  tabText: { fontSize: fontSize.sm, color: colors.text.secondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: colors.white, fontWeight: fontWeight.semibold },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  logIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accent.glow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  logDesc: { fontSize: fontSize.base, color: colors.text.primary, lineHeight: 22 },
  logMeta: { fontSize: fontSize.xs, color: colors.text.muted },
  hoursChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  deleteBtn: { padding: 6, backgroundColor: colors.bg.elevated, borderRadius: radius.sm, marginLeft: spacing.xs },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  taskCheck: { marginRight: spacing.sm },
  taskTitle: { flex: 1, fontSize: fontSize.base, color: colors.text.primary },
  taskDone: { textDecorationLine: 'line-through', color: colors.text.muted },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm, marginLeft: 4 },
  goalCard: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    marginBottom: spacing.sm,
  },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  goalTitle: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.primary },
  goalDesc: { fontSize: fontSize.sm, color: colors.text.secondary, marginBottom: spacing.sm, lineHeight: 20 },
  progressBg: { height: 6, backgroundColor: colors.bg.elevated, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: colors.accent.primary, borderRadius: 3 },
  progressText: { fontSize: fontSize.xs, color: colors.text.muted },
  addRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.bg.border, marginBottom: spacing.md,
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text.primary },
  closeBtn: { padding: spacing.sm, backgroundColor: colors.bg.elevated, borderRadius: radius.sm },
  fieldLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text.secondary, marginBottom: spacing.xs, marginTop: spacing.md },
});
