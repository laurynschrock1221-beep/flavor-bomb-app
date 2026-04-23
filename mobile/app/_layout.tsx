import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Slot } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Slot />
    </GestureHandlerRootView>
  )
}
