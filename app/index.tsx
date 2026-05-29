import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/auth/useAuth';
import { colors } from '@/ui/tokens';

export default function Index() {
  const { hydrated, isAuthed, user } = useAuth();
  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPage }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!isAuthed) return <Redirect href="/(auth)/login" />;
  if (!user?.onboarded) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)/diary" />;
}
