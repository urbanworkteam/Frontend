import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography } from '@/ui/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'] | React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function TabIcon({ icon, iconPack, focused, label }: { icon: string; iconPack: 'ion' | 'mci'; focused: boolean; label: string }) {
  const color = focused ? colors.primary : colors.textTertiary;
  return (
    <View style={styles.icon}>
      {iconPack === 'ion' ? (
        <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={22} color={color} />
      ) : (
        <MaterialCommunityIcons name={icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']} size={22} color={color} />
      )}
      <Text style={[styles.label, { color }]}>{label}</Text>
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
          tabBarIcon: ({ focused }) => <TabIcon icon="card" iconPack="ion" focused={focused} label="명함" />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="book" iconPack="ion" focused={focused} label="일지" />,
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="sparkles" iconPack="ion" focused={focused} label="콘텐츠" />,
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="person" iconPack="ion" focused={focused} label="MY" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { ...typography.small, fontSize: 10 },
});
