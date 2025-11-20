
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
import { router } from "expo-router";

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

  const handleViewPartnerProfile = () => {
    router.push("/(tabs)/partner-profile");
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
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
        <View style={styles.profileHeader}>
          <Pressable 
            onPress={handlePickImage} 
            style={styles.avatarContainer}
            disabled={uploadingImage}
          >
            <View style={styles.avatar}>
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
              <Text style={styles.name}>
                {profile?.full_name || "User"}
              </Text>
              <Text style={styles.email}>
                {user?.email || ""}
              </Text>
              {profile?.bio && (
                <Text style={styles.bio}>
                  {profile.bio}
                </Text>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.editInput}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  value={fullName}
                  onChangeText={setFullName}
                  editable={!loading}
                />
              </View>
              <View style={styles.editInputContainer}>
                <TextInput
                  style={[styles.editInput, styles.bioInput]}
                  placeholder="Bio (optional)"
                  placeholderTextColor="#999"
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
        </View>

        {/* Partner Information */}
        {partnerProfile && (
          <Pressable onPress={handleViewPartnerProfile}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Partner</Text>
              </View>
              <View style={styles.partnerInfo}>
                <View style={styles.partnerAvatar}>
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
                  <Text style={styles.partnerName}>
                    {partnerProfile.full_name || "Partner"}
                  </Text>
                  {partnerProfile.bio && (
                    <Text style={styles.partnerBio} numberOfLines={2}>
                      {partnerProfile.bio}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Pressable>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          {!isEditingProfile && (
            <Pressable style={styles.settingItem} onPress={handleEditProfile}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>
            </Pressable>
          )}

          {!isChangingPassword ? (
            <Pressable style={styles.settingItem} onPress={handleChangePassword}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingText}>Change Password</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.passwordChangeContainer}>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="New Password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
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
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <Pressable style={styles.settingItem} onPress={handleDeleteAccount}>
            <View style={styles.settingLeft}>
              <Text style={styles.deleteText}>Delete Account</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#E0E0E0",
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
    color: "#1A1A1A",
  },
  email: {
    fontSize: 16,
    color: "#666",
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    color: "#888",
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
    color: "#1A1A1A",
    backgroundColor: "#F5F5F5",
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
    backgroundColor: "#FFFFFF",
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
    color: "#1A1A1A",
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
    backgroundColor: "#E0E0E0",
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
    color: "#1A1A1A",
  },
  partnerBio: {
    fontSize: 14,
    marginTop: 4,
    color: "#888",
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
    color: "#1A1A1A",
  },
  deleteText: {
    fontSize: 16,
    color: "#FF3B30",
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
    color: "#1A1A1A",
    backgroundColor: "#F5F5F5",
  },
});
