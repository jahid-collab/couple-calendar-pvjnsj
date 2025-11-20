
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { colors } from "@/styles/commonStyles";
import { router } from "expo-router";

export default function PartnerProfileScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { partnerProfile, loading } = useCouple(user?.id);

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!partnerProfile) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View style={styles.header}>
          <Pressable onPress={handleGoBack} style={styles.backButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Partner Profile
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="person.fill.questionmark"
            android_material_icon_name="person_off"
            size={64}
            color={theme.dark ? "#666" : "#999"}
          />
          <Text style={[styles.emptyText, { color: theme.dark ? "#666" : "#999" }]}>
            No partner found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={theme.colors.text}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Partner Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

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
          <View
            style={[
              styles.avatar,
              { backgroundColor: theme.dark ? "#333" : "#E0E0E0" },
            ]}
          >
            {partnerProfile.avatar_url ? (
              <Image
                source={{ uri: partnerProfile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color={colors.secondary}
              />
            )}
          </View>

          <View style={styles.heartBadge}>
            <IconSymbol
              ios_icon_name="heart.fill"
              android_material_icon_name="favorite"
              size={16}
              color="#FFFFFF"
            />
          </View>

          <Text style={[styles.name, { color: theme.colors.text }]}>
            {partnerProfile.full_name || "Partner"}
          </Text>

          {partnerProfile.bio && (
            <Text style={[styles.bio, { color: theme.dark ? "#B0B0B0" : "#888" }]}>
              {partnerProfile.bio}
            </Text>
          )}
        </GlassView>

        {/* Profile Information */}
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
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              About
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={20}
                color={theme.dark ? "#98989D" : "#666"}
              />
              <Text style={[styles.infoLabel, { color: theme.dark ? "#98989D" : "#666" }]}>
                Name
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {partnerProfile.full_name || "Not set"}
            </Text>
          </View>

          {partnerProfile.bio && (
            <View style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <IconSymbol
                  ios_icon_name="text.alignleft"
                  android_material_icon_name="description"
                  size={20}
                  color={theme.dark ? "#98989D" : "#666"}
                />
                <Text style={[styles.infoLabel, { color: theme.dark ? "#98989D" : "#666" }]}>
                  Bio
                </Text>
              </View>
              <Text
                style={[
                  styles.infoValue,
                  styles.bioValue,
                  { color: theme.colors.text },
                ]}
              >
                {partnerProfile.bio}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar_today"
                size={20}
                color={theme.dark ? "#98989D" : "#666"}
              />
              <Text style={[styles.infoLabel, { color: theme.dark ? "#98989D" : "#666" }]}>
                Joined
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {new Date(partnerProfile.created_at).toLocaleDateString()}
            </Text>
          </View>
        </GlassView>

        {/* Relationship Stats */}
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
              ios_icon_name="heart.text.square.fill"
              android_material_icon_name="favorite_border"
              size={24}
              color={colors.secondary}
            />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Together
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="calendar.badge.clock"
                android_material_icon_name="event"
                size={32}
                color={colors.primary}
              />
              <Text style={[styles.statLabel, { color: theme.dark ? "#98989D" : "#666" }]}>
                Since
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {partnerProfile.couple_id
                  ? new Date(partnerProfile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A"}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={32}
                color={colors.secondary}
              />
              <Text style={[styles.statLabel, { color: theme.dark ? "#98989D" : "#666" }]}>
                Status
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                Connected
              </Text>
            </View>
          </View>
        </GlassView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSpacer: {
    width: 40,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  profileHeader: {
    alignItems: "center",
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    gap: 12,
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  heartBadge: {
    position: "absolute",
    top: 32,
    right: 32,
    backgroundColor: colors.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  bioValue: {
    textAlign: "right",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
  },
});
