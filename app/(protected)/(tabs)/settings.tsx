import { Image } from "expo-image";
import { router } from "expo-router";
import {
  ChevronRight,
  Crown,
  Lock,
  LogOut,
  Pencil,
} from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { useAuth, useUser } from "@/lib/clerk";

const isSubscribed = false;

type SettingsRowConfig = {
  label: string;
  value?: string;
  badgeLabel?: string;
  highlighted?: boolean;
  premiumOnly?: boolean;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void | Promise<void>;
};

type SettingsSectionProps = {
  title: string;
  rows: SettingsRowConfig[];
  isSubscribed: boolean;
};

type SettingsRowProps = {
  row: SettingsRowConfig;
  isSubscribed: boolean;
  isLast: boolean;
};

// TODO: Replace temporary profile values with authenticated user profile data.
const temporaryProfile = {
  height: "172 CM",
  weight: "62 KG",
};

// TODO: Add detail screens for these app settings when their routes are ready.
const appSettingsRows: SettingsRowConfig[] = [
  { label: "Account Information" },
  { label: "Notifications" },
  { label: "Profile Settings" },
  { label: "Text Size", value: "Medium" },
  { label: "Theme & Appearance", value: "Dark" },
  { label: "Language", value: "English" },
];

// TODO: Add detail screens for updating fitness preferences once those routes exist.
const fitnessPreferenceRows: SettingsRowConfig[] = [
  { label: "Fitness Goals" },
  { label: "Workout Level" },
  { label: "Preferred Workout Days" },
  { label: "Reminder Time", value: "7:00 AM" },
  { label: "Units", value: "Metric" },
];

// TODO: Replace temporary subscription state with real payment/subscription status.
const subscriptionRows: SettingsRowConfig[] = [
  { label: "Current Plan", value: "Free" },
  {
    label: "Upgrade to Premium",
    badgeLabel: "Premium",
    highlighted: true,
  },
  { label: "Manage Subscription" },
  { label: "Restore Purchases" },
];

// TODO: Connect AI feature access to real subscription entitlement checks.
const aiFeatureRows: SettingsRowConfig[] = [
  {
    label: "AI Workout Suggestions",
    premiumOnly: true,
    badgeLabel: "Premium",
  },
  {
    label: "AI Insights",
    premiumOnly: true,
    badgeLabel: "Premium",
  },
  {
    label: "Personalized Activity Plans",
    premiumOnly: true,
    badgeLabel: "Premium",
  },
];

const supportRows: SettingsRowConfig[] = [
  { label: "Help Center" },
  { label: "Contact Support" },
  { label: "Report a Problem" },
  { label: "Send Feedback" },
];

const legalRows: SettingsRowConfig[] = [
  { label: "Terms of Service" },
  { label: "Privacy Policy" },
  { label: "Data & Privacy" },
];

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const first = user?.firstName?.trim();
  const last = user?.lastName?.trim();
  const fullName = [first, last].filter(Boolean).join(" ").trim();
  const displayName =
    fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Youssef Labidi";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "YL";

  // Reuse the existing Clerk sign-out flow and return to the public login screen using a visible route path.
  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const accountRows: SettingsRowConfig[] = [
    {
      label: "Sign Out",
      destructive: true,
      showChevron: false,
      onPress: handleSignOut,
    },
  ];

  return (
    <AppScreen
      backgroundColor={colors.appDarkBlue}
      contentStyle={styles.screen}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile summary mirrors the reference layout and keeps temporary body metrics visible until profile data is wired. */}
        <View style={styles.profileCard}>
          <View style={styles.avatarRing}>
            {user?.imageUrl ? (
              <Image
                source={{ uri: user.imageUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{initials}</Text>
              </View>
            )}

            <Pressable
              style={styles.editAvatarButton}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Pencil size={14} color={colors.homeDark} strokeWidth={2.3} />
            </Pressable>
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileMetric}>{temporaryProfile.height}</Text>
          <Text style={styles.profileMetric}>{temporaryProfile.weight}</Text>
        </View>

        {/* Settings content is grouped into rounded cards so long lists stay scannable and match the dark product surfaces. */}
        <SettingsSection
          title="App Settings"
          rows={appSettingsRows}
          isSubscribed={isSubscribed}
        />
        <SettingsSection
          title="Fitness Preferences"
          rows={fitnessPreferenceRows}
          isSubscribed={isSubscribed}
        />
        <SettingsSection
          title="Subscription"
          rows={subscriptionRows}
          isSubscribed={isSubscribed}
        />
        <SettingsSection
          title="AI Features"
          rows={aiFeatureRows}
          isSubscribed={isSubscribed}
        />
        <SettingsSection
          title="Support"
          rows={supportRows}
          isSubscribed={isSubscribed}
        />
        <SettingsSection
          title="Legal"
          rows={legalRows}
          isSubscribed={isSubscribed}
        />
        <SettingsSection
          title="Account"
          rows={accountRows}
          isSubscribed={isSubscribed}
        />
      </ScrollView>
    </AppScreen>
  );
}

// Helper keeps each section title + rounded surface consistent without repeating the surrounding card markup.
function SettingsSection({
  title,
  rows,
  isSubscribed,
}: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionCard}>
        {rows.map((row, index) => (
          <SettingsRow
            key={row.label}
            row={row}
            isSubscribed={isSubscribed}
            isLast={index === rows.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

// Helper centralizes row states such as premium locking, highlighted upgrades, and the sign-out treatment.
function SettingsRow({ row, isSubscribed, isLast }: SettingsRowProps) {
  const isLocked = Boolean(row.premiumOnly && !isSubscribed);
  const isDisabled = isLocked || !row.onPress;
  const showPremiumBadge = Boolean(row.badgeLabel);

  return (
    <Pressable
      onPress={row.onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        row.highlighted && styles.rowHighlighted,
        isLocked && styles.rowLocked,
        pressed && !isDisabled && styles.rowPressed,
      ]}
    >
      <View style={styles.rowContent}>
        <View style={styles.rowTextColumn}>
          <Text style={[styles.rowLabel, row.destructive && styles.rowLabelDanger]}>
            {row.label}
          </Text>
        </View>

        <View style={styles.rowAccessory}>
          {row.value ? <Text style={styles.rowValue}>{row.value}</Text> : null}

          {showPremiumBadge ? (
            <View
              style={[
                styles.badge,
                isLocked ? styles.badgeLocked : styles.badgePremium,
              ]}
            >
              {isLocked ? (
                <Lock size={11} color={colors.homeCream} strokeWidth={2.1} />
              ) : row.highlighted ? (
                <Crown size={11} color={colors.homeDark} strokeWidth={2.1} />
              ) : null}
              <Text
                style={[
                  styles.badgeText,
                  isLocked ? styles.badgeTextLocked : styles.badgeTextPremium,
                ]}
              >
                {row.badgeLabel}
              </Text>
            </View>
          ) : null}

          {row.label === "Sign Out" ? (
            <LogOut size={17} color="#FFB3C0" strokeWidth={2.15} />
          ) : row.showChevron === false ? null : (
            <ChevronRight
              size={17}
              color="rgba(255,255,255,0.48)"
              strokeWidth={2.1}
            />
          )}
        </View>
      </View>

      {!isLast ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 132,
  },
  profileCard: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 28,
  },
  avatarRing: {
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "#F6D1E8",
  },
  avatarImage: {
    width: 126,
    height: 126,
    borderRadius: 63,
  },
  avatarFallback: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7BA798",
  },
  avatarFallbackText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 34,
  },
  editAvatarButton: {
    position: "absolute",
    right: 6,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.homeCream,
  },
  profileName: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 30,
    lineHeight: 34,
    textAlign: "center",
  },
  profileMetric: {
    color: "rgba(255,255,255,0.46)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: "rgba(255,255,255,0.82)",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "rgba(89, 78, 110, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowHighlighted: {
    backgroundColor: "rgba(246, 243, 186, 0.08)",
  },
  rowLocked: {
    opacity: 0.76,
  },
  rowPressed: {
    opacity: 0.84,
  },
  rowContent: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowTextColumn: {
    flex: 1,
    justifyContent: "center",
  },
  rowLabel: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  rowLabelDanger: {
    color: "#FFCDD7",
  },
  rowValue: {
    color: "rgba(255,255,255,0.46)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
  },
  rowAccessory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  divider: {
    height: 1,
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badge: {
    minHeight: 24,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgePremium: {
    backgroundColor: colors.homeCream,
  },
  badgeLocked: {
    backgroundColor: "rgba(246, 243, 186, 0.15)",
  },
  badgeText: {
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  badgeTextPremium: {
    color: colors.homeDark,
  },
  badgeTextLocked: {
    color: colors.homeCream,
  },
});
