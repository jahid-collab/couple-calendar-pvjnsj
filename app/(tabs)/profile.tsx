
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { colors } from "@/styles/commonStyles";
import { supabase } from "@/app/integrations/supabase/client";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const { profile, partnerProfile, updateProfile, refetch } = useCouple(user?.id);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleEditProfile = () => {
    setFullName(profile?.full_name || "");
    setBio(profile?.bio || "");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
      });
      Alert.alert("Success", "Profile updated successfully!");
      setIsEditingProfile(false);
      await refetch();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setFullName(profile?.full_name || "");
    setBio(profile?.bio || "");
  };

  const handleChangePassword = () => {
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPassword(true);
  };

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      Alert.alert("Success", "Password changed successfully!");
      setIsChangingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      Alert.alert("Error", error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error("Error signing out:", error);
              Alert.alert("Error", "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and will remove all your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "Final Confirmation",
              "This will permanently delete your account and all associated data. Are you absolutely sure?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    setLoading(true);
                    try {
                      // Delete user data from couple_profiles
                      if (user?.id) {
                        const { error: profileError } = await supabase
                          .from("couple_profiles")
                          .delete()
                          .eq("user_id", user.id);

                        if (profileError) {
                          console.error("Error deleting profile:", profileError);
                        }
                      }

                      // Sign out (Supabase doesn't allow users to delete their own accounts via client SDK)
                      await signOut();
                      Alert.alert(
                        "Account Deletion Requested",
                        "Your account data has been removed. Please contact support to complete account deletion."
                      );
                    } catch (error: any) {
                      console.error("Error deleting account:", error);
                      Alert.alert("Error", error.message || "Failed to delete account");
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photo library to upload a profile picture."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setUploadingImage(true);
    try {
      console.log("Starting avatar upload for user:", user.id);
      
      // Convert image URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a unique file name
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      console.log("Uploading to:", fileName);

      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
          
          if (deleteError) {
            console.error("Error deleting old avatar:", deleteError);
          }
        }
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log("Public URL:", urlData.publicUrl);

      // Update profile with new avatar URL
      await updateProfile({
        avatar_url: urlData.publicUrl,
      });

      Alert.alert("Success", "Profile picture updated successfully!");
      await refetch();
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", error.message || "Failed to upload profile picture");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== "ios" && styles.contentContainerWithTabBar,
        ]}
      >
        {/* Profile Header */}
        <GlassView
          style={[
            styles.profileHeader,
            Platform.OS !== "ios" && {
              backgroundColor: theme.dark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          glassEffectStyle="regular"
        >
          <Pressable 
            onPress={handlePickImage} 
            style={styles.avatarContainer}
            disabled={uploadingImage}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.dark ? "#333" : "#E0E0E0" },
              ]}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={48}
                  color={colors.primary}
                />
              )}
            </View>
            <View style={styles.editBadge}>
              {uploadingImage ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <IconSymbol
                  ios_icon_name="camera.fill"
                  android_material_icon_name="camera"
                  size={12}
                  color="#FFFFFF"
                />
              )}
            </View>
          </Pressable>

          {!isEditingProfile ? (
            <React.Fragment>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {profile?.full_name || "User"}
              </Text>
              <Text style={[styles.email, { color: theme.dark ? "#98989D" : "#666" }]}>
                {user?.email || ""}
              </Text>
              {profile?.bio && (
                <Text style={[styles.bio, { color: theme.dark ? "#B0B0B0" : "#888" }]}>
                  {profile.bio}
                </Text>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <View style={styles.editInputContainer}>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.dark ? "#2C2C2E" : "#F5F5F5",
                    },
                  ]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.dark ? "#666" : "#999"}
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
              </View>
              <View style={styles.editInputContainer}>
                <TextInput
                  style={[
                    styles.editInput,
                    styles.bioInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.dark ? "#2C2C2E" : "#F5F5F5",
                    },
                  ]}
                  placeholder="Bio (optional)"
                  placeholderTextColor={theme.dark ? "#666" : "#999"}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  editable={!loading}
                />
              </View>
              <View style={styles.editButtons}>
                <Pressable
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </React.Fragment>
          )}
        </GlassView>

        {/* Partner Information */}
        {partnerProfile && (
          <GlassView
            style={[
              styles.section,
              Platform.OS !== "ios" && {
                backgroundColor: theme.dark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
            glassEffectStyle="regular"
          >
            <View style={styles.sectionHeader}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Partner
              </Text>
            </View>
            <View style={styles.partnerInfo}>
              <View
                style={[
                  styles.partnerAvatar,
                  { backgroundColor: theme.dark ? "#333" : "#E0E0E0" },
                ]}
              >
                {partnerProfile.avatar_url ? (
                  <Image
                    source={{ uri: partnerProfile.avatar_url }}
                    style={styles.partnerAvatarImage}
                  />
                ) : (
                  <IconSymbol
                    ios_icon_name="person.fill"
                    android_material_icon_name="person"
                    size={32}
                    color={colors.secondary}
                  />
                )}
              </View>
              <View style={styles.partnerDetails}>
                <Text style={[styles.partnerName, { color: theme.colors.text }]}>
                  {partnerProfile.full_name || "Partner"}
                </Text>
                {partnerProfile.bio && (
                  <Text
                    style={[styles.partnerBio, { color: theme.dark ? "#B0B0B0" : "#888" }]}
                  >
                    {partnerProfile.bio}
                  </Text>
                )}
              </View>
            </View>
          </GlassView>
        )}

        {/* Settings Section */}
        <GlassView
          style={[
            styles.section,
            Platform.OS !== "ios" && {
              backgroundColor: theme.dark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          glassEffectStyle="regular"
        >
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="gearshape.fill"
              android_material_icon_name="settings"
              size={24}
              color={theme.dark ? "#98989D" : "#666"}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Settings
            </Text>
          </View>

          {!isEditingProfile && (
            <Pressable style={styles.settingItem} onPress={handleEditProfile}>
              <View style={styles.settingLeft}>
                <IconSymbol
                  ios_icon_name="pencil"
                  android_material_icon_name="edit"
                  size={20}
                  color={theme.dark ? "#98989D" : "#666"}
                />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Edit Profile
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={theme.dark ? "#666" : "#999"}
              />
            </Pressable>
          )}

          {!isChangingPassword ? (
            <Pressable style={styles.settingItem} onPress={handleChangePassword}>
              <View style={styles.settingLeft}>
                <IconSymbol
                  ios_icon_name="lock.fill"
                  android_material_icon_name="lock"
                  size={20}
                  color={theme.dark ? "#98989D" : "#666"}
                />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Change Password
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={theme.dark ? "#666" : "#999"}
              />
            </Pressable>
          ) : (
            <View style={styles.passwordChangeContainer}>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.dark ? "#2C2C2E" : "#F5F5F5",
                    },
                  ]}
                  placeholder="New Password"
                  placeholderTextColor={theme.dark ? "#666" : "#999"}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      color: theme.colors.text,
                      backgroundColor: theme.dark ? "#2C2C2E" : "#F5F5F5",
                    },
                  ]}
                  placeholder="Confirm Password"
                  placeholderTextColor={theme.dark ? "#666" : "#999"}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
              <View style={styles.editButtons}>
                <Pressable
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={handleCancelPasswordChange}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.editButton, styles.saveButton]}
                  onPress={handleSavePassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </GlassView>

        {/* Account Section */}
        <GlassView
          style={[
            styles.section,
            Platform.OS !== "ios" && {
              backgroundColor: theme.dark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
          glassEffectStyle="regular"
        >
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="person.crop.circle"
              android_material_icon_name="account_circle"
              size={24}
              color={theme.dark ? "#98989D" : "#666"}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Account
            </Text>
          </View>

          <Pressable style={styles.settingItem} onPress={handleSignOut}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="arrow.right.square"
                android_material_icon_name="logout"
                size={20}
                color={theme.dark ? "#98989D" : "#666"}
              />
              <Text style={[styles.settingText, { color: theme.colors.text }]}>
                Sign Out
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.dark ? "#666" : "#999"}
            />
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleDeleteAccount}>
            <View style={styles.settingLeft}>
              <IconSymbol
                ios_icon_name="trash.fill"
                android_material_icon_name="delete"
                size={20}
                color="#FF3B30"
              />
              <Text style={[styles.settingText, { color: "#FF3B30" }]}>
                Delete Account
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.dark ? "#666" : "#999"}
            />
          </Pressable>
        </GlassView>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: theme.dark ? "#666" : "#999" }]}>
            Couple&apos;s Calendar
          </Text>
          <Text style={[styles.appInfoText, { color: theme.dark ? "#666" : "#999" }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  email: {
    fontSize: 16,
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  editInputContainer: {
    width: "100%",
    marginTop: 8,
  },
  editInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    width: "100%",
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  editButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    width: "100%",
  },
  editButton: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  partnerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  partnerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  partnerAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  partnerBio: {
    fontSize: 14,
    marginTop: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  passwordChangeContainer: {
    marginTop: 12,
  },
  passwordInputContainer: {
    marginBottom: 12,
  },
  passwordInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  appInfo: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
    gap: 4,
  },
  appInfoText: {
    fontSize: 12,
  },
});
