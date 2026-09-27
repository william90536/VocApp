import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';
import { colors } from '@/components/ui';

function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ color, fontSize: 19, fontWeight: '800', lineHeight: 22 }}>{glyph}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 1 },
        tabBarStyle: {
          height: 65,
          paddingTop: 7,
          paddingBottom: 7,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: '單字本', tabBarIcon: ({ color }) => <TabGlyph glyph="Aa" color={color} /> }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: '學習', tabBarIcon: ({ color }) => <TabGlyph glyph="▤" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '設定', tabBarIcon: ({ color }) => <TabGlyph glyph="⚙" color={color} /> }}
      />
    </Tabs>
  );
}
