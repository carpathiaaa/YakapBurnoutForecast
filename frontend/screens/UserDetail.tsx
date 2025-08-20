import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useEffect, useState } from "react";

type UserDetailRouteProp = RouteProp<RootStackParamList, "UserDetail">;

interface UserProfile {
  energizedDays?: string[];
  focusHours?: { start: string; end: string };
  recoveryStrategies?: string[];
  stressSignals?: string[];
  workArrangement?: string;
}

export default function UserDetail() {
  const route = useRoute<UserDetailRouteProp>();
  const { userId, email, department } = route.params;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile({
            energizedDays: data.profile?.energizedDays || [],
            focusHours: data.profile?.focusHours || null,
            recoveryStrategies: data.profile?.recoveryStrategies || [],
            stressSignals: data.profile?.stressSignals || [],
            workArrangement: data.profile?.workArrangement || null,
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Employee Passport</Text>

      {/* Basic Info */}
      <View style={styles.card}>
        <Text style={styles.label}>📧 Email</Text>
        <Text style={styles.value}>{email}</Text>

        <Text style={styles.label}>🏢 Department</Text>
        <Text style={styles.value}>{department}</Text>

        <Text style={styles.label}>💼 Work Arrangement</Text>
        <Text style={styles.value}>{profile?.workArrangement || "No data"}</Text>
      </View>

      {/* Energized Days & Focus Hours */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardHeader}>⚡ Energized Days</Text>
          {profile?.energizedDays?.length ? (
            profile.energizedDays.map((day, idx) => (
              <Text key={idx} style={styles.item}>• {day}</Text>
            ))
          ) : (
            <Text style={styles.item}>No data</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>⏰ Focus Hours</Text>
          {profile?.focusHours ? (
            <>
              <Text style={styles.item}>Start: {profile.focusHours.start}</Text>
              <Text style={styles.item}>End: {profile.focusHours.end}</Text>
            </>
          ) : (
            <Text style={styles.item}>No data</Text>
          )}
        </View>
      </View>

      {/* Recovery Strategies & Stress Signals */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.cardHeader}>🌱 Recovery Strategies</Text>
          {profile?.recoveryStrategies?.length ? (
            profile.recoveryStrategies.map((strategy, idx) => (
              <Text key={idx} style={styles.item}>• {strategy}</Text>
            ))
          ) : (
            <Text style={styles.item}>No data</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeader}>⚠️ Stress Signals</Text>
          {profile?.stressSignals?.length ? (
            profile.stressSignals.map((signal, idx) => (
              <Text key={idx} style={styles.item}>• {signal}</Text>
            ))
          ) : (
            <Text style={styles.item}>No data</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  header: { fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center", color: "#111827" },

  // Cards
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    boxShadow: "0px 4px 8px rgba(0,0,0,0.08)",
  },

  // Layout
  row: { flexDirection: "row", marginBottom: 12 },

  // Typography
  label: { fontSize: 14, fontWeight: "600", marginTop: 6, color: "#374151" },
  value: { fontSize: 16, marginBottom: 8, color: "#111827" },
  cardHeader: { fontSize: 18, fontWeight: "700", marginBottom: 10, color: "#1f2937" },
  item: { fontSize: 15, marginBottom: 6, color: "#4b5563" },

  // Centered loader
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
