import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fontSize, icon, maxFontScale, radius, space, touch } from '@/theme/tokens';
import { AppText } from './app-text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  password?: boolean;
  multiline?: boolean;
  counter?: number;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, password, multiline, counter, value, editable = true, ...props },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <AppText variant="label" nativeID={`${label}-label`}>
        {label}
      </AppText>
      <View
        style={[
          styles.box,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.invalid : null,
          !editable && styles.readOnly,
        ]}
      >
        <TextInput
          ref={ref}
          {...props}
          value={value}
          editable={editable}
          multiline={multiline}
          secureTextEntry={password ? hidden : false}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textMuted}
          maxFontSizeMultiplier={maxFontScale}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((v) => !v)}
            hitSlop={8}
            style={styles.eye}
          >
            {hidden ? (
              <Eye size={icon.md} color={colors.textMuted} />
            ) : (
              <EyeOff size={icon.md} color={colors.textMuted} />
            )}
          </Pressable>
        ) : null}
      </View>
      <View style={styles.meta}>
        {error ? (
          <AppText variant="caption" tone="danger" style={styles.metaText} accessibilityLiveRegion="polite">
            {error}
          </AppText>
        ) : hint ? (
          <AppText variant="caption" tone="muted" style={styles.metaText}>
            {hint}
          </AppText>
        ) : (
          <View style={styles.metaText} />
        )}
        {counter ? (
          <AppText variant="caption" tone="muted">
            {(value ?? '').length}/{counter}
          </AppText>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: space.xs },
  box: {
    minHeight: touch.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  multiline: { alignItems: 'flex-start', minHeight: 140 },
  focused: { borderColor: colors.primary, borderWidth: 1.5 },
  invalid: { borderColor: colors.danger },
  readOnly: { backgroundColor: colors.surfaceMuted },
  input: {
    flex: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: touch.minHeight,
  },
  inputMultiline: { minHeight: 140, paddingTop: space.md },
  eye: { width: touch.iconButton, height: touch.iconButton, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  metaText: { flex: 1 },
});
