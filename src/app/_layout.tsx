import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/db/schema';

initDatabase();

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F6FA' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="deck/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="study/[deckId]" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
      </Stack>
    </>
  );
}
