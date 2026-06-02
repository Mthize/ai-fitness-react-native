import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useLinkBuilder } from "@react-navigation/native";
import {
  Calendar,
  ChartNoAxesColumn,
  LayoutGrid,
  Settings,
  type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RouteStatusScreen } from "@/components/RouteStatusScreen";
import { colors } from "@/constants/colors";
import {
  getUserOnboardingCompleted,
  LOGIN_ROUTE,
  ONBOARDING_ROUTE,
} from "@/lib/auth";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { useSessionActivationState } from "@/lib/session-activation";

const tabIcons = {
  index: LayoutGrid,
  schedule: Calendar,
  statistics: ChartNoAxesColumn,
  settings: Settings,
} as const;

type TabIconName = keyof typeof tabIcons;

function TabBarIcon({
  focused,
  name,
}: {
  focused: boolean;
  name: TabIconName;
}) {
  const Icon = tabIcons[name] as LucideIcon;

  return (
    <Icon
      color={focused ? colors.background : "rgba(255,255,255,0.28)"}
      size={22}
      strokeWidth={2.2}
      absoluteStrokeWidth
    />
  );
}

// Mirrors the current floating design while still using the navigation events expected by Expo Router tabs.
function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: Math.max(insets.bottom + 8, 28),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const iconName = route.name as TabIconName;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <PlatformPressable
            key={route.key}
            href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBarButton}
          >
            <View
              style={
                isFocused
                  ? styles.activeTabIconWrapper
                  : styles.inactiveTabIconWrapper
              }
            >
              <TabBarIcon focused={isFocused} name={iconName} />
            </View>
          </PlatformPressable>
        );
      })}
    </View>
  );
}

export default function ProtectedTabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { user } = useUser();
  const { pending, sessionId } = useSessionActivationState();
  const clerkSessionId = clerk.session?.id ?? null;
  const onboardingCompleted = getUserOnboardingCompleted(user);
  const isSessionAvailable =
    isSignedIn || pending || Boolean(clerkSessionId) || Boolean(user?.id);

  // Keep redirects centralized here so tabs never mount for signed-out or not-yet-onboarded users.
  let redirectTarget: string | null = null;

  if (isLoaded) {
    if (pending) {
      redirectTarget = ONBOARDING_ROUTE;
    } else if (!isSessionAvailable) {
      redirectTarget = LOGIN_ROUTE;
    } else if (!onboardingCompleted) {
      redirectTarget = ONBOARDING_ROUTE;
    }
  }

  console.log("[TABS ONBOARDING DEBUG] isLoaded", isLoaded);
  console.log("[TABS ONBOARDING DEBUG] pendingActivation", pending);
  console.log("[TABS ONBOARDING DEBUG] pendingSessionId", sessionId);
  console.log("[TABS ONBOARDING DEBUG] isSignedIn", isSignedIn);
  console.log("[TABS ONBOARDING DEBUG] userId", user?.id ?? null);
  console.log("[TABS ONBOARDING DEBUG] clerkSessionId", clerkSessionId);
  console.log(
    "[TABS ONBOARDING DEBUG] unsafeMetadata",
    user?.unsafeMetadata ?? null,
  );
  console.log(
    "[TABS ONBOARDING DEBUG] onboardingCompleted",
    onboardingCompleted,
  );
  console.log("[TABS ONBOARDING DEBUG] redirectTarget", redirectTarget);

  if (!isLoaded) {
    return <RouteStatusScreen title="Loading session..." />;
  }

  if (redirectTarget) {
    return <Redirect href={redirectTarget} />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: "Statistics",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 28,
    right: 28,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(86, 78, 111, 0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  tabBarButton: {
    flex: 1,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabIconWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.journeyText,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveTabIconWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(43, 35, 57, 0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
});
