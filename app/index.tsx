import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import Colors from "@/constants/colors";
import { useAppState } from "@/providers/AppState";

export default function RootIndex() {
  const { currentUser, isInitialized } = useAppState();
  
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }
  
  if (!currentUser) {
    return <Redirect href="/login" />;
  }
  
  return <Redirect href="/(tabs)/assignments" />;
}
