
import { SystemBars } from "react-native-edge-to-edge";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme, Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { Button } from "@/components/button";
import { useFonts } from "expo-font";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const { isConnected } = useNetworkState();
  const { user, loading: authLoading } = useAuth();
  const { couple, profile, loading: coupleLoading } = useCouple(user?.id);
  const segments = useSegments();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (authLoading || coupleLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inSetupGroup = segments[0] === '(setup)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('Navigation check:', { user: !!user, couple: !!couple, profile: !!profile, segments });

    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (user && !inTabsGroup && !inSetupGroup) {
      // Check if user has a couple or partner email set
      if (!couple && !profile?.partner_email && !inSetupGroup) {
        // Redirect to partner setup
        router.replace('/(setup)/partner');
      } else {
        // Redirect to main app
        router.replace('/(tabs)/(home)');
      }
    }
  }, [user, couple, profile, authLoading, coupleLoading, segments]);

  useEffect(() => {
    if (isConnected === false) {
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    }
  }, [isConnected]);

  if (!loaded || authLoading) {
    return null;
  }

  const theme: Theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WidgetProvider>
        <ThemeProvider value={theme}>
          <SystemBars style="auto" />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(setup)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                headerTitle: "Modal",
                headerRight: () => (
                  <Button onPress={() => router.back()}>Close</Button>
                ),
              }}
            />
            <Stack.Screen
              name="formsheet"
              options={{
                presentation: "formSheet",
                headerTitle: "Form Sheet",
                headerRight: () => (
                  <Button onPress={() => router.back()}>Close</Button>
                ),
              }}
            />
            <Stack.Screen
              name="transparent-modal"
              options={{
                presentation: "transparentModal",
                animation: "fade",
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </WidgetProvider>
    </GestureHandlerRootView>
  );
}
