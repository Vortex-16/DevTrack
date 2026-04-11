import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { projectsApi } from '../../../src/services/api';
import { useProjectsStore, useUIStore } from '../../../src/store';
import {
  Folder, Plus, Search, Trash2, Edit3, ExternalLink, X,
  GitBranch, Clock, Zap, Code2, CheckCircle2, PauseCircle, Circle
} from 'lucide-react-native';
import { Button, SectionHeader, Badge, EmptyState, FullScreenLoader, Toast, ScreenHeader } from '../../../src/components/ui';
import { colors, spacing, radius, fontSize, fontWeight, globalStyles } from '../../../src/theme';
import type { Project } from '../../../src/store';

// ─── Status config ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active', color: colors.green.default, icon: Zap },
  { label: 'Planned', value: 'planned', color: colors.blue.default, icon: Circle },
  { label: 'Paused', value: 'paused', color: colors.yellow.default, icon: PauseCircle },
  { label: 'Completed', value: 'completed', color: colors.text.muted, icon: CheckCircle2 },
];

const getStatus = (val: string) => STATUS_OPTIONS.find((s) => s.value === val) ?? STATUS_OPTIONS[0];

// ─── Project Card ────────────────────────────────────────────────
interface ProjectCardProps {
  project: Project;
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}
function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const st = getStatus(project.status);
  const Icon = st.icon;
  return (
    <View style={[s.card, { borderLeftColor: st.color, borderLeftWidth: 2 }]}>
      <View style={s.cardHeader}>
        <View style={[s.statusDot, { backgroundColor: st.color + '20', borderColor: st.color + '50' }]}>
          <Icon size={12} color={st.color} />
        </View>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={s.cardTitle}>{project.name}</Text>
          {project.language && (
            <Text style={s.cardLang}>{project.language}</Text>
          )}
        </View>
        <View style={s.cardActions}>
          <TouchableOpacity onPress={() => onEdit(project)} style={s.actionBtn}>
            <Edit3 size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Delete Project', `Are you sure you want to delete "${project.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDelete(project.id) },
              ])
            }
            style={s.actionBtn}
          >
            <Trash2 size={16} color={colors.red.default} />
          </TouchableOpacity>
        </View>
      </View>

      {project.description ? (
        <Text style={s.cardDesc} numberOfLines={2}>{project.description}</Text>
      ) : null}

      <View style={s.cardMeta}>
        {(project.techStack ?? []).slice(0, 3).map((t) => (
          <Badge key={t} label={t} color={colors.accent.primary} style={{ marginRight: 6, marginBottom: 4 }} />
        ))}
      </View>

      <View style={s.cardFooter}>
        <Badge label={st.label} color={st.color} />
        {project.commits != null && (
          <View style={s.commitsRow}>
            <GitBranch size={12} color={colors.text.muted} />
            <Text style={s.commitText}>{project.commits} commits</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Modal ───────────────────────────────────────────────────────
interface ProjectModalProps {
  visible: boolean;
  project: Partial<Project> | null;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
  saving: boolean;
}

function ProjectModal({ visible, project, onClose, onSave, saving }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [lang, setLang] = useState('');
  const [github, setGithub] = useState('');
  const [live, setLive] = useState('');
  const [stack, setStack] = useState('');
  const [status, setStatus] = useState<Project['status']>('active');

  useEffect(() => {
    if (project) {
      setName(project.name ?? '');
      setDesc(project.description ?? '');
      setLang(project.language ?? '');
      setGithub(project.githubUrl ?? '');
      setLive(project.liveUrl ?? '');
      setStack((project.techStack ?? []).join(', '));
      setStatus(project.status ?? 'active');
    } else {
      setName(''); setDesc(''); setLang(''); setGithub('');
      setLive(''); setStack(''); setStatus('active');
    }
  }, [project, visible]);

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Error', 'Project name is required');
    onSave({
      name: name.trim(),
      description: desc.trim(),
      language: lang.trim(),
      githubUrl: github.trim(),
      liveUrl: live.trim(),
      techStack: stack ? stack.split(',').map((t) => t.trim()).filter(Boolean) : [],
      status,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={[globalStyles.screen, { paddingHorizontal: spacing.lg }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{project?.id ? 'Edit Project' : 'New Project'}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={s.fieldLabel}>Project Name *</Text>
            <TextInput style={globalStyles.input} value={name} onChangeText={setName}
              placeholder="e.g. DevTrack Mobile" placeholderTextColor={colors.text.muted} />

            {/* Description */}
            <Text style={s.fieldLabel}>Description</Text>
            <TextInput style={[globalStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={desc} onChangeText={setDesc} multiline
              placeholder="Brief description of the project" placeholderTextColor={colors.text.muted} />

            {/* Language */}
            <Text style={s.fieldLabel}>Primary Language</Text>
            <TextInput style={globalStyles.input} value={lang} onChangeText={setLang}
              placeholder="e.g. TypeScript" placeholderTextColor={colors.text.muted} />

            {/* Tech Stack */}
            <Text style={s.fieldLabel}>Tech Stack (comma separated)</Text>
            <TextInput style={globalStyles.input} value={stack} onChangeText={setStack}
              placeholder="React Native, Firebase, Clerk..." placeholderTextColor={colors.text.muted} />

            {/* GitHub URL */}
            <Text style={s.fieldLabel}>GitHub URL</Text>
            <TextInput style={globalStyles.input} value={github} onChangeText={setGithub}
              placeholder="https://github.com/..." placeholderTextColor={colors.text.muted}
              autoCapitalize="none" keyboardType="url" />

            {/* Live URL */}
            <Text style={s.fieldLabel}>Live URL</Text>
            <TextInput style={globalStyles.input} value={live} onChangeText={setLive}
              placeholder="https://..." placeholderTextColor={colors.text.muted}
              autoCapitalize="none" keyboardType="url" />

            {/* Status */}
            <Text style={s.fieldLabel}>Status</Text>
            <View style={s.statusGrid}>
              {STATUS_OPTIONS.map((opt) => {
                const active = status === opt.value;
                const Icon = opt.icon;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.statusOption, active && { backgroundColor: opt.color + '20', borderColor: opt.color }]}
                    onPress={() => setStatus(opt.value as Project['status'])}
                  >
                    <Icon size={14} color={active ? opt.color : colors.text.muted} />
                    <Text style={[s.statusOptionText, { color: active ? opt.color : colors.text.muted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 32 }} />
            <Button label={project?.id ? 'Save Changes' : 'Create Project'} onPress={handleSave} loading={saving} />
            <View style={{ height: 32 }} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function ProjectsScreen() {
  const { projects, setProjects, addProject, updateProject, removeProject, loading, setLoading, refreshing, setRefreshing } = useProjectsStore();
  const { showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editProject, setEditProject] = useState<Partial<Project> | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const displayToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectsApi.getAll({});
      const projectsArray = res.data?.data?.projects ?? (Array.isArray(res.data?.data) ? res.data.data : []);
      setProjects(projectsArray);
    } catch (err) {
      console.error('Projects fetch error:', err);
      displayToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProjects();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const openCreate = () => {
    setEditProject(null);
    setModalVisible(true);
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setModalVisible(true);
  };

  const handleSave = async (data: Partial<Project>) => {
    setSaving(true);
    try {
      if (editProject?.id) {
        const res = await projectsApi.update(editProject.id, data);
        updateProject(editProject.id, res.data?.data ?? data);
        displayToast('Project updated!', 'success');
      } else {
        const res = await projectsApi.create(data);
        addProject(res.data?.data ?? { id: Date.now().toString(), ...data } as Project);
        displayToast('Project created!', 'success');
      }
      setModalVisible(false);
    } catch (err) {
      console.error('Save error:', err);
      displayToast('Failed to save project', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectsApi.delete(id);
      removeProject(id);
      displayToast('Project deleted', 'info');
    } catch (err) {
      displayToast('Failed to delete project', 'error');
    }
  };

  const safeProjects = Array.isArray(projects) ? projects : [];
  const filtered = safeProjects
    .filter((p) => {
      const matchSearch = (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });

  if (loading && safeProjects.length === 0) return <FullScreenLoader />;

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScreenHeader
        title="Projects"
        subtitle={`${safeProjects.length} total`}
        right={
          <TouchableOpacity style={s.addBtn} onPress={openCreate}>
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        }
      />

      {/* ── Search ── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Search size={16} color={colors.text.muted} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search projects..."
            placeholderTextColor={colors.text.muted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={14} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter tabs ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {['all', ...STATUS_OPTIONS.map((s) => s.value)].map((f) => {
          const opt = STATUS_OPTIONS.find((o) => o.value === f);
          const active = filterStatus === f;
          return (
            <TouchableOpacity
              key={f}
              style={[s.filterTab, active && { backgroundColor: (opt?.color ?? colors.accent.primary) + '20', borderColor: opt?.color ?? colors.accent.primary }]}
              onPress={() => setFilterStatus(f)}
            >
              <Text style={[s.filterTabText, active && { color: opt?.color ?? colors.accent.primary }]}>
                {f === 'all' ? 'All' : (opt?.label ?? f)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard project={item} onEdit={openEdit} onDelete={handleDelete} />
        )}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Folder size={32} color={colors.text.muted} />}
            title={search ? 'No results found' : 'No Projects Yet'}
            subtitle={search ? 'Try a different search term.' : 'Create your first project to start tracking.'}
            action={!search ? { label: 'Add Project', onPress: openCreate } : undefined}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />

      <ProjectModal
        visible={modalVisible}
        project={editProject}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        saving={saving}
      />

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  addBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.accent.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.secondary,
  },
  filterTabText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  statusDot: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  cardLang: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
  },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commitText: {
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
    marginBottom: spacing.md,
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
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.secondary,
  },
  statusOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
