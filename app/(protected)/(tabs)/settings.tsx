import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { ChevronRight, LogOut, Pencil } from "lucide-react-native";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppScreen } from "@/components/AppScreen";
import { colors } from "@/constants/colors";
import { getUserProfileDisplayState } from "@/lib/auth";
import { useAuth, useUser } from "@/lib/clerk";

const NEUTRAL_SWITCH_TRACK = "rgba(255,255,255,0.16)";
const NEUTRAL_SWITCH_THUMB = "#F4F4F4";

type SettingsRowConfig = {
  label: string;
  value?: string;
  destructive?: boolean;
  showChevron?: boolean;
  type?: "navigation" | "toggle" | "action";
  enabled?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void | Promise<void>;
};

type SettingsSectionProps = { title: string; rows: SettingsRowConfig[] };

type SettingsRowProps = {
  row: SettingsRowConfig;
  isLast: boolean;
};

type ActiveModal = "profile" | "name" | "weight" | "height" | "gender" | null;
type BusyAction = "name" | "weight" | "height" | "gender" | "photo" | null;
type GenderOption = "Male" | "Female" | "Other";

const GENDER_OPTIONS: GenderOption[] = ["Male", "Female", "Other"];

type EditableUserMethods = {
  unsafeMetadata?: Record<string, unknown> | null;
  delete?: () => Promise<unknown>;
  update?: (params: { firstName?: string; lastName?: string }) => Promise<unknown>;
  updateMetadata?: (params: {
    unsafeMetadata: Record<string, unknown>;
  }) => Promise<unknown>;
  setProfileImage?: (params: { file: File | Blob | null }) => Promise<unknown>;
  reload?: () => Promise<unknown>;
};

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const profile = getUserProfileDisplayState(user);
  const editableUser = user as (NonNullable<typeof user> & EditableUserMethods) | null;
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [appleWatchEnabled, setAppleWatchEnabled] = useState(false);
  const [healthAppEnabled, setHealthAppEnabled] = useState(false);
  const [workoutRemindersEnabled, setWorkoutRemindersEnabled] = useState(true);
  const [weekStartsOn, setWeekStartsOn] = useState<"Sunday" | "Monday">(
    "Monday",
  );
  const [firstNameInput, setFirstNameInput] = useState(user?.firstName?.trim() ?? "");
  const [lastNameInput, setLastNameInput] = useState(user?.lastName?.trim() ?? "");
  const [weightInput, setWeightInput] = useState(
    profile.weight ? String(profile.weight) : "",
  );
  const [heightInput, setHeightInput] = useState(
    profile.height ? String(profile.height) : "",
  );
  const [genderInput, setGenderInput] = useState<GenderOption | null>(
    isGenderOption(profile.gender) ? profile.gender : null,
  );

  const first = user?.firstName?.trim();
  const last = user?.lastName?.trim();
  const fullName = [first, last].filter(Boolean).join(" ").trim();
  const displayName =
    fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  useEffect(() => {
    setFirstNameInput(user?.firstName?.trim() ?? "");
    setLastNameInput(user?.lastName?.trim() ?? "");
  }, [user?.firstName, user?.lastName]);

  useEffect(() => {
    setWeightInput(profile.weight ? String(profile.weight) : "");
  }, [profile.weight]);

  useEffect(() => {
    setHeightInput(profile.height ? String(profile.height) : "");
  }, [profile.height]);

  useEffect(() => {
    setGenderInput(isGenderOption(profile.gender) ? profile.gender : null);
  }, [profile.gender]);

  async function reloadUser() {
    if (typeof editableUser?.reload === "function") {
      await editableUser.reload();
    }
  }

  async function persistOnboardingProfile(partial: Record<string, unknown>) {
    if (!editableUser || typeof editableUser.updateMetadata !== "function") {
      throw new Error("User metadata update is not available.");
    }

    const unsafeMetadata = editableUser.unsafeMetadata ?? {};
    const onboarding =
      typeof unsafeMetadata.onboarding === "object" &&
      unsafeMetadata.onboarding !== null
        ? (unsafeMetadata.onboarding as Record<string, unknown>)
        : {};

    // TODO: Replace onboarding-metadata profile edits with a persisted backend user profile.
    await editableUser.updateMetadata({
      unsafeMetadata: {
        ...unsafeMetadata,
        onboarding: {
          ...onboarding,
          ...partial,
        },
      },
    });

    await reloadUser();
  }

  function closeModal() {
    if (busyAction) {
      return;
    }

    setActiveModal(null);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  async function handleDeleteAccountConfirmed() {
    // TODO: Delete user data from backend storage when account deletion is implemented.
    // TODO: Revoke auth sessions after account deletion.
    // TODO: Do not store plaintext passwords. Passwords must be handled by the auth provider using secure hashing.
    // TODO: Encrypt sensitive user data at rest and use secure transport when backend is added.
    const deleteUser = editableUser?.delete;

    if (typeof deleteUser !== "function") {
      console.warn(
        "[settings] Account deletion is not wired in the current auth provider surface yet.",
      );
      return;
    }

    try {
      await deleteUser.call(user);
      router.replace("/login");
    } catch (error) {
      console.warn("[settings] Failed to delete account.", error);
    }
  }

  function handleDeleteAccountPress() {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDeleteAccountConfirmed();
          },
        },
      ],
    );
  }

  async function handleSaveName() {
    const updateUser = editableUser?.update;
    const trimmedFirstName = firstNameInput.trim();
    const trimmedLastName = lastNameInput.trim();

    if (!trimmedFirstName && !trimmedLastName) {
      Alert.alert("Name required", "Enter a first name or last name.");
      return;
    }

    if (typeof updateUser !== "function") {
      Alert.alert("Unavailable", "Name editing is not available right now.");
      return;
    }

    setBusyAction("name");

    try {
      await updateUser({
        firstName: trimmedFirstName || undefined,
        lastName: trimmedLastName || undefined,
      });
      await reloadUser();
      setActiveModal(null);
    } catch (error) {
      console.warn("[settings] Failed to update name.", error);
      Alert.alert("Unable to save", "We could not update your name right now.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveWeight() {
    const parsedWeight = Number(weightInput);

    if (!weightInput || !Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      Alert.alert("Invalid weight", "Enter a valid weight.");
      return;
    }

    setBusyAction("weight");

    try {
      await persistOnboardingProfile({
        weight: Math.round(parsedWeight * 10) / 10,
      });
      setActiveModal(null);
    } catch (error) {
      console.warn("[settings] Failed to update weight.", error);
      Alert.alert("Unable to save", "We could not update your weight right now.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveHeight() {
    const parsedHeight = Number(heightInput);

    if (!heightInput || !Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      Alert.alert("Invalid height", "Enter a valid height.");
      return;
    }

    setBusyAction("height");

    try {
      await persistOnboardingProfile({
        height: Math.round(parsedHeight),
      });
      setActiveModal(null);
    } catch (error) {
      console.warn("[settings] Failed to update height.", error);
      Alert.alert("Unable to save", "We could not update your height right now.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveGender() {
    if (!genderInput) {
      Alert.alert("Select gender", "Choose a gender option.");
      return;
    }

    setBusyAction("gender");

    try {
      await persistOnboardingProfile({
        gender: genderInput,
      });
      setActiveModal(null);
    } catch (error) {
      console.warn("[settings] Failed to update gender.", error);
      Alert.alert("Unable to save", "We could not update your gender right now.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleChangeProfilePicture() {
    const setProfileImage = editableUser?.setProfileImage;

    if (typeof setProfileImage !== "function") {
      Alert.alert("Unavailable", "Profile picture updates are not available right now.");
      return;
    }

    setActiveModal(null);
    setBusyAction("photo");

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Photo access needed",
          "Allow photo library access to choose a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      if (typeof File !== "function") {
        throw new Error("File API is unavailable in this runtime.");
      }

      const file = new File(
        [blob],
        asset.fileName ?? `profile-${Date.now()}.jpg`,
        { type: asset.mimeType ?? "image/jpeg" },
      );

      await setProfileImage({ file });
      await reloadUser();
    } catch (error) {
      console.warn("[settings] Failed to change profile picture.", error);
      Alert.alert(
        "Unable to update picture",
        "We could not change your profile picture right now.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function handleDeletePicturePress() {
    const setProfileImage = editableUser?.setProfileImage;

    if (typeof setProfileImage !== "function") {
      Alert.alert("Unavailable", "Profile picture updates are not available right now.");
      return;
    }

    Alert.alert(
      "Delete picture",
      "Remove your current profile picture?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setActiveModal(null);
              setBusyAction("photo");

              try {
                await setProfileImage({ file: null });
                await reloadUser();
              } catch (error) {
                console.warn("[settings] Failed to delete profile picture.", error);
                Alert.alert(
                  "Unable to delete picture",
                  "We could not remove your profile picture right now.",
                );
              } finally {
                setBusyAction(null);
              }
            })();
          },
        },
      ],
    );
  }

  const accountRows: SettingsRowConfig[] = [
    {
      label: "Personal Information",
      value: displayName,
      showChevron: false,
    },
    {
      label: "Unit of Measure",
      value: profile.displayUnitOfMeasure,
      showChevron: false,
    },
    {
      label: "Weight",
      value: profile.displayWeight,
      onPress: () => {
        setWeightInput(profile.weight ? String(profile.weight) : "");
        setActiveModal("weight");
      },
    },
    {
      label: "Height",
      value: profile.displayHeight,
      onPress: () => {
        setHeightInput(profile.height ? String(profile.height) : "");
        setActiveModal("height");
      },
    },
    {
      label: "Gender",
      value: profile.displayGender,
      onPress: () => {
        setGenderInput(isGenderOption(profile.gender) ? profile.gender : null);
        setActiveModal("gender");
      },
    },
  ];

  const dangerRows: SettingsRowConfig[] = [
    {
      label: "Delete",
      destructive: true,
      showChevron: false,
      onPress: handleDeleteAccountPress,
    },
  ];

  const subscriptionRows: SettingsRowConfig[] = [
    {
      label: "Manage Subscription",
      onPress: () => {
        router.push("/subscription");
      },
    },
    {
      label: "Restore Subscription",
      type: "action",
      showChevron: false,
      onPress: () => {
        // TODO: Connect to App Store / Play Store restore purchase flow later.
      },
    },
  ];

  const appSettingsRows: SettingsRowConfig[] = [
    {
      label: "Notifications",
      onPress: () => {
        router.push("/notifications");
      },
    },
    {
      label: "Apple Watch",
      type: "toggle",
      enabled: appleWatchEnabled,
      onToggle: setAppleWatchEnabled,
      showChevron: false,
    },
    {
      label: "Health App",
      type: "toggle",
      enabled: healthAppEnabled,
      onToggle: setHealthAppEnabled,
      showChevron: false,
    },
    {
      label: "Workout Reminders",
      type: "toggle",
      enabled: workoutRemindersEnabled,
      onToggle: setWorkoutRemindersEnabled,
      showChevron: false,
    },
    {
      label: "Week Starts On",
      value: weekStartsOn,
      onPress: () => {
        setWeekStartsOn((current) =>
          current === "Sunday" ? "Monday" : "Sunday",
        );
      },
    },
  ];

  const supportRows: SettingsRowConfig[] = [
    { label: "Terms and Conditions", showChevron: false },
    { label: "Privacy Policy", showChevron: false },
    { label: "Acknowledgements", showChevron: false },
  ];

  const feedbackRows: SettingsRowConfig[] = [
    { label: "Write to Us", showChevron: false },
    { label: "Rate the App", showChevron: false },
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
              onPress={() => setActiveModal("profile")}
              style={styles.editAvatarButton}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              {busyAction === "photo" ? (
                <ActivityIndicator size="small" color={colors.homeDark} />
              ) : (
                <Pencil size={14} color={colors.homeDark} strokeWidth={2.3} />
              )}
            </Pressable>
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileMetric}>{profile.displayHeight}</Text>
          <Text style={styles.profileMetric}>{profile.displayWeight}</Text>
        </View>

        <SettingsSection
          title="Account"
          rows={accountRows}
        />
        <SettingsSection
          title="Subscription"
          rows={subscriptionRows}
        />
        <SettingsSection
          title="App Settings"
          rows={appSettingsRows}
        />
        <SettingsSection
          title="Support"
          rows={supportRows}
        />
        <SettingsSection
          title="Feedback"
          rows={feedbackRows}
        />
        <SettingsSection
          title="Delete Account"
          rows={dangerRows}
        />

        <Pressable
          onPress={() => void handleSignOut()}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.signOutButton,
            pressed && styles.rowPressed,
          ]}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
          <LogOut size={17} color="#FFB3C0" strokeWidth={2.15} />
        </Pressable>
      </ScrollView>

      <Modal
        transparent
        visible={activeModal === "profile"}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <Pressable
              onPress={() => setActiveModal("name")}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text style={styles.modalOptionText}>Edit Name</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                void handleChangeProfilePicture();
              }}
              style={({ pressed }) => [
                styles.modalOption,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text style={styles.modalOptionText}>Change Picture</Text>
            </Pressable>

            <Pressable
              onPress={handleDeletePicturePress}
              style={({ pressed }) => [
                styles.modalOption,
                !user?.imageUrl && styles.modalOptionDisabled,
                pressed && user?.imageUrl && styles.modalOptionPressed,
              ]}
              disabled={!user?.imageUrl}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  styles.modalDangerText,
                  !user?.imageUrl && styles.modalOptionTextDisabled,
                ]}
              >
                Delete Picture
              </Text>
            </Pressable>

            <Pressable
              onPress={closeModal}
              style={({ pressed }) => [
                styles.modalCancelButton,
                pressed && styles.modalOptionPressed,
              ]}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <EditValueModal
        visible={activeModal === "name"}
        title="Edit Name"
        primaryActionLabel={busyAction === "name" ? "Saving..." : "Save"}
        isBusy={busyAction === "name"}
        onClose={closeModal}
        onSave={() => {
          void handleSaveName();
        }}
      >
        <TextInput
          value={firstNameInput}
          onChangeText={setFirstNameInput}
          placeholder="First name"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.modalInput}
        />
        <TextInput
          value={lastNameInput}
          onChangeText={setLastNameInput}
          placeholder="Last name"
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.modalInput}
        />
      </EditValueModal>

      <EditValueModal
        visible={activeModal === "weight"}
        title="Edit Weight"
        subtitle={`Enter your weight in ${profile.weightUnit}.`}
        primaryActionLabel={busyAction === "weight" ? "Saving..." : "Save"}
        isBusy={busyAction === "weight"}
        onClose={closeModal}
        onSave={() => {
          void handleSaveWeight();
        }}
      >
        <TextInput
          value={weightInput}
          onChangeText={(value) => setWeightInput(value.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          placeholder={`Weight (${profile.weightUnit})`}
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.modalInput}
        />
      </EditValueModal>

      <EditValueModal
        visible={activeModal === "height"}
        title="Edit Height"
        subtitle={`Enter your height in ${
          profile.heightUnit === "inches" ? "inches" : "cm"
        }.`}
        primaryActionLabel={busyAction === "height" ? "Saving..." : "Save"}
        isBusy={busyAction === "height"}
        onClose={closeModal}
        onSave={() => {
          void handleSaveHeight();
        }}
      >
        <TextInput
          value={heightInput}
          onChangeText={(value) => setHeightInput(value.replace(/[^0-9.]/g, ""))}
          keyboardType="decimal-pad"
          placeholder={`Height (${
            profile.heightUnit === "inches" ? "in" : "cm"
          })`}
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={styles.modalInput}
        />
      </EditValueModal>

      <EditValueModal
        visible={activeModal === "gender"}
        title="Select Gender"
        primaryActionLabel={busyAction === "gender" ? "Saving..." : "Save"}
        isBusy={busyAction === "gender"}
        onClose={closeModal}
        onSave={() => {
          void handleSaveGender();
        }}
      >
        <View style={styles.genderOptionColumn}>
          {GENDER_OPTIONS.map((option) => {
            const isSelected = genderInput === option;

            return (
              <Pressable
                key={option}
                onPress={() => setGenderInput(option)}
                style={({ pressed }) => [
                  styles.genderOptionButton,
                  isSelected && styles.genderOptionButtonSelected,
                  pressed && styles.modalOptionPressed,
                ]}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    isSelected && styles.genderOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </EditValueModal>
    </AppScreen>
  );
}

function isGenderOption(value: string | null): value is GenderOption {
  return value === "Male" || value === "Female" || value === "Other";
}

function SettingsSection({ title, rows }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.sectionCard}>
        {rows.map((row, index) => (
          <SettingsRow
            key={row.label}
            row={row}
            isLast={index === rows.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

function SettingsRow({ row, isLast }: SettingsRowProps) {
  const isToggle = row.type === "toggle";
  const isDisabled = isToggle ? !row.onToggle : !row.onPress;
  const isDestructiveAction = row.destructive && row.type !== "toggle";

  return (
    <Pressable
      onPress={row.onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
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
          {row.value ? (
            <Text style={[styles.rowValue, row.destructive && styles.rowValueDanger]}>
              {row.value}
            </Text>
          ) : null}

          {isToggle ? (
            <Switch
              trackColor={{
                false: NEUTRAL_SWITCH_TRACK,
                true: NEUTRAL_SWITCH_TRACK,
              }}
              thumbColor={NEUTRAL_SWITCH_THUMB}
              ios_backgroundColor={NEUTRAL_SWITCH_TRACK}
              value={Boolean(row.enabled)}
              onValueChange={row.onToggle}
            />
          ) : isDestructiveAction ? null : row.label === "Sign Out" ? (
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

function EditValueModal({
  visible,
  title,
  subtitle,
  primaryActionLabel,
  isBusy,
  onClose,
  onSave,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  primaryActionLabel: string;
  isBusy: boolean;
  onClose: () => void;
  onSave: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}

          <View style={styles.modalInputColumn}>{children}</View>

          <View style={styles.modalButtonRow}>
            <Pressable
              onPress={onClose}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.modalSecondaryButton,
                pressed && !isBusy && styles.modalOptionPressed,
              ]}
            >
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onSave}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.modalPrimaryButton,
                pressed && !isBusy && styles.modalPrimaryButtonPressed,
              ]}
            >
              <Text style={styles.modalPrimaryText}>{primaryActionLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  rowValueDanger: {
    color: "#FFCDD7",
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
  signOutButton: {
    marginTop: 24,
    minHeight: 54,
    borderRadius: 24,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  signOutButtonText: {
    color: "#FFCDD7",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(6, 6, 12, 0.66)",
  },
  modalCard: {
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    backgroundColor: "#211C2E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalTitle: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Bold",
    fontSize: 20,
    lineHeight: 26,
  },
  modalSubtitle: {
    marginTop: 8,
    color: "rgba(255,255,255,0.58)",
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  modalInputColumn: {
    marginTop: 18,
    gap: 12,
  },
  modalInput: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-Regular",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
  },
  modalPrimaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  modalPrimaryButtonPressed: {
    opacity: 0.88,
  },
  modalPrimaryText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalSecondaryText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  modalOption: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 14,
  },
  modalOptionPressed: {
    opacity: 0.84,
  },
  modalOptionDisabled: {
    opacity: 0.45,
  },
  modalOptionText: {
    color: colors.journeyText,
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  modalOptionTextDisabled: {
    color: "rgba(255,255,255,0.38)",
  },
  modalDangerText: {
    color: "#FFCDD7",
  },
  modalCancelButton: {
    minHeight: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginTop: 14,
  },
  modalCancelText: {
    color: "rgba(255,255,255,0.58)",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  genderOptionColumn: {
    gap: 12,
  },
  genderOptionButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  genderOptionButtonSelected: {
    borderColor: "rgba(255,255,255,0.52)",
  },
  genderOptionText: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "MontserratAlternates-SemiBold",
    fontSize: 14,
  },
  genderOptionTextSelected: {
    color: colors.journeyText,
  },
});
