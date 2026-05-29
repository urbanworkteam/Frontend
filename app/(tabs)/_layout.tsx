import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/ui/tokens';

function TabIcon({ emoji, focused, label }: { emoji: string; focused: boolean; label: string }) {
  return (
    <View style={styles.icon}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      <Text style={[styles.label, { color: focused ? colors.primary : colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 64, paddingBottom: 6, paddingTop: 6, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🪪" focused={focused} label="명함" />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📔" focused={focused} label="일지" />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="✨" focused={focused} label="콘텐츠" />,
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} label="MY" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { ...typography.small, fontSize: 10 },
});
