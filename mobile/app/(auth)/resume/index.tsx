import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useAuth } from '@clerk/clerk-expo';
import { colors, globalStyles, fontSize, fontWeight, spacing } from '../../../src/theme';
import { FullScreenLoader, ScreenHeader } from '../../../src/components/ui';
import Constants from 'expo-constants';

// The web app URL for the resume builder — update in production
const RESUME_WEB_URL = 'https://devtrack-client.onrender.com/resume';

export default function ResumeBuilderScreen() {
  const { getToken } = useAuth();
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const t = await getToken();
        setToken(t);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <FullScreenLoader />;

  // Inject Clerk token into the WebView session so auth works
  const injectedJS = token
    ? `
      (function() {
        try {
          localStorage.setItem('__clerk_mobile_token', '${token}');
        } catch(e) {}
      })();
      true;
    `
    : '';

  return (
    <SafeAreaView style={globalStyles.screen}>
      <ScreenHeader title="Resume Builder" subtitle="Build your professional resume" />
      <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
        {token ? (
          <WebView
            source={{ uri: RESUME_WEB_URL }}
            injectedJavaScript={injectedJS}
            style={{ flex: 1, backgroundColor: colors.bg.primary }}
            startInLoadingState
            renderLoading={() => <FullScreenLoader />}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
          />
        ) : (
          <View style={s.errorState}>
            <Text style={s.errorTitle}>Authentication Required</Text>
            <Text style={s.errorSub}>Please sign in to access the resume builder.</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
