import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { useLinkBuilder } from "@react-navigation/native";
import { BlurView } from "expo-blur";
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
  LOGIN_ROUTE,
  ONBOARDING_ROUTE,
  useResolvedOnboardingCompletion,
} from "@/lib/auth";
import { useAuth, useClerk, useUser } from "@/lib/clerk";
import { useSessionActivationState } from "@/lib/session-activation";

const tabIcons = {
  home: LayoutGrid,
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
      color={focused ? colors.activeTabIcon : colors.inactiveTabIcon}
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
          bottom: Math.max(insets.bottom, 28),
        },
      ]}
    >
      <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.tabBarOverlay} />

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
  const { pending } = useSessionActivationState();
  const userId = user?.id ?? null;
  const clerkSessionId = clerk.session?.id ?? null;
  const hasActiveClerkSession = Boolean(userId && clerkSessionId);
  const isResolvedSignedIn = Boolean(isSignedIn || hasActiveClerkSession);
  const {
    hasCompletedOnboarding: onboardingCompleted,
    isLoading: isOnboardingStatusLoading,
  } = useResolvedOnboardingCompletion(user);

  // Keep redirects centralized here so tabs never mount for signed-out or not-yet-onboarded users.
  let redirectTarget: string | null = null;

  if (isLoaded) {
    if (!isResolvedSignedIn) {
      redirectTarget = LOGIN_ROUTE;
    } else if (!onboardingCompleted) {
      redirectTarget = ONBOARDING_ROUTE;
    }
  }

  if (!isLoaded || pending || (isResolvedSignedIn && isOnboardingStatusLoading)) {
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
        name="home"
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
    height: 94,
    borderRadius: 47,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.tabBarOutline,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.tabBarBackground,
  },
  tabBarButton: {
    flex: 1,
    height: 94,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTabIconWrapper: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.journeyText,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveTabIconWrapper: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.inactiveTabBackground,
    alignItems: "center",
    justifyContent: "center",
  },
});
