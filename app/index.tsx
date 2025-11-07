import { Redirect } from "expo-router";
import { useAppState } from "@/providers/AppState";

export default function RootIndex() {
  const { currentUser } = useAppState();
  
  if (!currentUser) {
    return <Redirect href="/login" />;
  }
  
  return <Redirect href="/(tabs)/assignments" />;
}
