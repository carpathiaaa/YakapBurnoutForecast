import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../services/firebase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/navigation"; // adjust to your navigation setup

interface UserEntry {
  id: string;
  email: string; 
  trend?: string;   
  timestamp?: Date; 
  department?: string;
  dataSharing: boolean;
}

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UserDetail"
>;

export default function UsersWithForecasts() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const fetchUsersAndForecasts = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const userList: UserEntry[] = [];

        for (const userDoc of usersSnapshot.docs) {
          const data = userDoc.data();

          // ⚡ Only include if preferences.dataSharing exists
          if (!data.preferences || typeof data.preferences.dataSharing === "undefined") {
            continue;
          }

          const userId = userDoc.id;
          const dataSharing = data.preferences.dataSharing;

          let trend: string | undefined = undefined;
          let timestamp: Date | undefined = undefined;

          // only fetch forecasts if dataSharing is true
          if (dataSharing) {
            const forecastsRef = collection(db, "burnout_forecasts");
            const q = query(
              forecastsRef,
              where("userId", "==", userId),
              orderBy("timestamp", "desc"),
              limit(1)
            );
            const forecastSnap = await getDocs(q);

            if (!forecastSnap.empty) {
              const forecastData = forecastSnap.docs[0].data();
              trend = forecastData.trend;
              timestamp = forecastData.timestamp?.toDate?.() || undefined;
            }
          }

          const department: string | undefined = data.profile?.department || "Not specified";

          userList.push({
            id: userId,
            email: data.email || "No email",
            trend,
            timestamp,
            department,
            dataSharing,
          });
        }

        setUsers(userList);
      } catch (error) {
        console.error("Error fetching users/forecasts:", error);
      }
    };

    fetchUsersAndForecasts();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12, color: "#222" }}>
        👥 Your Team Dashboard
      </Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          // If dataSharing is false → non-pressable
          if (!item.dataSharing) {
            return (
              <View
                style={{
                  padding: 16,
                  marginVertical: 8,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 16,
                  boxShadow: "0px 4px 8px rgba(0,0,0,0.12)",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#666" }}>
                  {item.email}
                </Text>
              </View>
            );
          }

          // Pressable card if dataSharing is true
          return (
            <TouchableOpacity
              style={{
                padding: 16,
                marginVertical: 8,
                backgroundColor: "#ffffff",
                borderRadius: 16,
                boxShadow: "0px 4px 8px rgba(0,0,0,0.12)",
              }}
              onPress={() =>
                navigation.navigate("UserDetail", {
                  userId: item.id,
                  email: item.email,
                  department: item.department || "Not specified",
                })
              }
            >
              {/* Email */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 6,
                  color: "#1a1a1a",
                }}
              >
                {item.email}
              </Text>

              {/* Forecast Trend */}
              {item.trend ? (
                <View>
                  <Text style={{ fontSize: 15, color: "#444", lineHeight: 22 }}>
                    🌤 Mood Forecast: {item.trend}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#777",
                      marginTop: 2,
                      fontStyle: "italic",
                    }}
                  >
                    as of {item.timestamp?.toLocaleDateString()}
                  </Text>
                </View>
              ) : (
                <Text style={{ fontSize: 14, color: "#aaa" }}>No forecast available</Text>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
