import { Redirect } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { ActivityIndicator, View } from "react-native";
import Colors from "@/constants/colors";

export default function RootIndex() {
  const { profile, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }
  
  if (!profile) {
    return <Redirect href="/login" />;
  }
  
  return <Redirect href="/(tabs)/assignments" />;
}
