import { Text, View, StyleSheet } from "react-native";

export function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sanctuary</Text>
      <Text>Biodiversity tracking — mobile app shell</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
