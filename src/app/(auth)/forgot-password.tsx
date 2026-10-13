import { router } from 'expo-router';
import { KeyRound, Phone } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { colors, space } from '@/theme/tokens';

const STEPS = [
  'Call or visit the clinic and ask for a new app code.',
  'The clinic gives you a 6-digit code. It works for 24 hours.',
  'Tap the button below, enter your phone number, the code and a new password.',
];

export default function ForgotPasswordScreen() {
  return (
    <Screen>
      <AppText tone="muted">
        For your privacy, passwords are reset only through the clinic. This keeps anyone else from opening
        your medical records.
      </AppText>
      <Card>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.step}>
            <AppText weight="semibold" tone="primary">
              {index + 1}.
            </AppText>
            <AppText style={styles.flex}>{step}</AppText>
          </View>
        ))}
      </Card>
      <Button label="I have a new code" icon={KeyRound} onPress={() => router.replace('/activate')} />
      <View style={styles.hint}>
        <Phone size={16} color={colors.textMuted} />
        <AppText variant="caption" tone="muted" style={styles.flex}>
          The clinic phone number is on your appointment slip and prescription.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row', gap: space.sm },
  flex: { flex: 1 },
  hint: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
});
