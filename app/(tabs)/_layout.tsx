import { Tabs } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';
import { COLORS, useTheme } from '../../src/utils/theme';

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Thunlai',
          tabBarIcon: ({ color, size }) => <TabIcon emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerTitle: 'Search',
          tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          headerTitle: 'Learning Hub',
          tabBarIcon: ({ color }) => <TabIcon emoji="📚" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: 'Saved',
          headerTitle: 'Saved Words',
          tabBarIcon: ({ color }) => <TabIcon emoji="★" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'About',
          headerTitle: 'About',
          tabBarIcon: ({ color }) => <TabIcon emoji="⚙️" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22, opacity: color === COLORS.primary ? 1 : 0.5 }}>{emoji}</Text>;
}
