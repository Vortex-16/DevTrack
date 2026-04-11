import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
  Image, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import {
  User, Bell, Github, Shield, ChevronRight, LogOut, ExternalLink,
  Sun, Moon, Info, Code2, Star, FileText, Zap, Mail,
} from 'lucide-react-native';
import { preferencesApi, notificationsApi, authApi } from '../../../src/services/api';
import { useAuthStore } from '../../../src/store';
import { ScreenHeader, Toast, Button } from '../../../src/components/ui';
import { colors, spacing, radius, fontSize, fontWeight, globalStyles } from '../../../src/theme';
import { registerForPushNotificationsAsync, sendLocalNotification } from '../../../src/services/notifications';

// ─── Row Components ───────────────────────────────────────────────
interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}
function SettingRow({ icon, label, value, onPress, right, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: danger ? colors.red.bg : colors.bg.elevated }]}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, danger && { color: colors.red.default }]}>{label}</Text>
        {value && <Text style={s.rowValue}>{value}</Text>}
      </View>
      {right ?? <ChevronRight size={16} color={colors.text.muted} />}
    </TouchableOpacity>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { preferences, setPreferences } = useAuthStore();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const ghAccount = user?.externalAccounts?.find(acc => acc.provider && acc.provider.includes('github'));
  const githubUsername = ghAccount?.username || preferences?.githubUsername;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await preferencesApi.get();
        const prefs = res.data?.data;
        if (prefs) {
          setPreferences(prefs);
          setNotifEnabled(prefs.notificationsEnabled ?? false);
        }
      } catch { /* silent */ }
      finally { setLoadingPrefs(false); }
    })();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await authApi.sync();
      showToast('Account synced successfully!', 'success');
    } catch {
      showToast('Sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleNotifToggle = async (val: boolean) => {
    try {
      if (val) {
        // This will trigger the system permission popup
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await notificationsApi.registerToken(token);
          setNotifEnabled(true);
          await preferencesApi.update({ notificationsEnabled: true });
          showToast('Notifications enabled!', 'success');
          
          // Send a welcome notification
          setTimeout(() => {
            sendLocalNotification('Notifications Active 🚀', 'You will now receive weekly reports and reminders.');
          }, 1000);
        }
      } else {
        await notificationsApi.unregisterToken();
        setNotifEnabled(false);
        await preferencesApi.update({ notificationsEnabled: false });
        showToast('Notifications disabled', 'info');
      }
    } catch (e: any) {
      setNotifEnabled(false);
      const isMobile = e.message?.includes('device');
      showToast(isMobile ? 'Use a physical device for push' : 'Permission denied', 'error');
      console.error('Notification error:', e);
    }
  };

  const testNotif = async () => {
    try {
      await sendLocalNotification('Test Notification', 'Everything is working perfectly! ✅');
      showToast('Test sent!', 'success');
    } catch (e) {
      showToast('Test failed', 'error');
    }
  };

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ── Profile Card ── */}
        <View style={s.profileCard}>
          <View style={s.avatarCircle}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={s.avatarImg} />
            ) : (
              <Text style={s.avatarInitial}>{(user?.firstName?.[0] ?? '?').toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{user?.fullName ?? 'Developer'}</Text>
            <Text style={s.profileEmail}>{user?.emailAddresses?.[0]?.emailAddress ?? ''}</Text>
            {githubUsername && (
              <Text style={s.profileGithub}>github.com/{githubUsername}</Text>
            )}
          </View>
        </View>

        {/* ── Account ── */}
        <SectionTitle title="Account" />
        <View style={s.section}>
          <SettingRow
            icon={<User size={16} color={colors.accent.primary} />}
            label="Manage Profile"
            value="via Clerk account portal"
            onPress={() => Linking.openURL('https://accounts.clerk.com')}
          />
          <View style={s.divider} />
          <SettingRow
            icon={<Zap size={16} color={colors.green.default} />}
            label="Sync Account"
            value="Force re-sync with backend"
            onPress={handleSync}
            right={syncing ? <ActivityIndicator size="small" color={colors.accent.primary} /> : undefined}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionTitle title="Notifications" />
        <View style={s.section}>
          <SettingRow
            icon={<Bell size={16} color={colors.yellow.default} />}
            label="Push Notifications"
            value="Weekly reports & reminders"
            right={
              <Switch
                value={notifEnabled}
                onValueChange={handleNotifToggle}
                trackColor={{ false: colors.bg.elevated, true: colors.accent.primary + '80' }}
                thumbColor={notifEnabled ? colors.accent.primary : colors.text.muted}
              />
            }
          />
          {notifEnabled && (
            <>
              <View style={s.divider} />
              <SettingRow
                icon={<Star size={16} color={colors.accent.primary} />}
                label="Test Notification"
                value="Send a sample alert to this device"
                onPress={testNotif}
              />
            </>
          )}
        </View>

        {/* ── Integrations ── */}
        <SectionTitle title="Integrations" />
        <View style={s.section}>
          <SettingRow
            icon={<Github size={16} color={colors.text.primary} />}
            label="GitHub"
            value={githubUsername ? `@${githubUsername}` : 'Not connected'}
            onPress={() => Linking.openURL('https://github.com')}
          />
          <View style={s.divider} />
          <SettingRow
            icon={<Code2 size={16} color={colors.orange.default} />}
            label="LeetCode"
            value="Manage via web app preferences"
            onPress={() => {}}
          />
        </View>

        {/* ── Resume Builder ── */}
        <SectionTitle title="Tools" />
        <View style={s.section}>
          <SettingRow
            icon={<FileText size={16} color={colors.cyan.default} />}
            label="Resume Builder"
            value="Build & export your resume"
            onPress={() => router.push('/(auth)/resume' as any)}
          />
        </View>

        {/* ── About ── */}
        <SectionTitle title="About" />
        <View style={s.section}>
          <SettingRow
            icon={<Info size={16} color={colors.text.secondary} />}
            label="DevTrack Mobile"
            value="v1.0.0 — Built with Expo & React Native"
            right={<View />}
          />
          <View style={s.divider} />
          <SettingRow
            icon={<Star size={16} color={colors.yellow.default} />}
            label="Rate the App"
            onPress={() => {}}
          />
          <View style={s.divider} />
          <SettingRow
            icon={<Mail size={16} color={colors.blue.default} />}
            label="Send Feedback"
            onPress={() => Linking.openURL('mailto:feedback@devtrack.app')}
          />
        </View>

        {/* ── Sign Out ── */}
        <SectionTitle title="" />
        <View style={s.section}>
          <SettingRow
            icon={<LogOut size={16} color={colors.red.default} />}
            label="Sign Out"
            danger
            onPress={handleSignOut}
          />
        </View>

        <Text style={s.footer}>Made with ❤️ by Vortex-16</Text>
      </ScrollView>
      {toast && <Toast message={toast.msg} type={toast.type} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent.primary + '40',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.accent.glow,
    borderWidth: 2,
    borderColor: colors.accent.primary + '60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImg: { width: 64, height: 64 },
  avatarInitial: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.accent.primary },
  profileName: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text.primary },
  profileEmail: { fontSize: fontSize.sm, color: colors.text.secondary, marginTop: 2 },
  profileGithub: { fontSize: fontSize.xs, color: colors.text.muted, marginTop: 2 },
  sectionTitle: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: spacing.lg,
    paddingBottom: 6,
    paddingTop: spacing.md,
  },
  section: {
    backgroundColor: colors.bg.secondary,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.bg.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rowLabel: { fontSize: fontSize.base, color: colors.text.primary, fontWeight: fontWeight.medium },
  rowValue: { fontSize: fontSize.xs, color: colors.text.muted, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.bg.border, marginLeft: 58 },
  footer: {
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
