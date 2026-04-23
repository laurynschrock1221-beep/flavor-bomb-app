import { Stack } from 'expo-router'

export default function RecipesStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle:      { backgroundColor: '#fdf6ec' },
        headerTintColor:  '#1a1a1a',
        headerTitleStyle: { fontFamily: 'Georgia', fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index"  options={{ title: 'Recipes' }} />
      <Stack.Screen name="[id]"   options={{ title: 'Recipe'  }} />
      <Stack.Screen name="import" options={{ title: 'Import Recipe' }} />
    </Stack>
  )
}
