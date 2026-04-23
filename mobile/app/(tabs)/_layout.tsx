import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   '#C1440E',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle:             { backgroundColor: '#fff', borderTopColor: '#f0ebe3' },
        headerStyle:             { backgroundColor: '#fdf6ec' },
        headerTitleStyle:        { fontFamily: 'Georgia', fontWeight: '700', fontSize: 17 },
        headerTintColor:         '#1a1a1a',
      }}
    >
      <Tabs.Screen
        name="recipes"
        options={{
          title:         'Recipes',
          headerShown:   false,
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title:         'Planner',
          headerShown:   false,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
