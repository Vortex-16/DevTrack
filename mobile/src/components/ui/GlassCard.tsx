import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '../../theme';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  radiusSize?: number;
};

export function GlassCard({
  children,
  style,
  contentStyle,
  intensity = 52,
  tint = 'dark',
  radiusSize = 28,
}: GlassCardProps) {
  return (
    <View style={[s.shell, { borderRadius: radiusSize }, style]}>
      <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      <View style={[s.overlay, { borderRadius: radiusSize }, contentStyle]}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(20,24,32,0.58)',
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});

export default GlassCard;