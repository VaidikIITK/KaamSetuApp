import { View, Text, StyleSheet } from 'react-native';

export default function PostJobScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔨</Text>
      <Text style={styles.title}>Post New Job</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F1FB',
    gap: 10,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5B2D8E',
  },
  subtitle: {
    fontSize: 14,
    color: '#888899',
  },
});
