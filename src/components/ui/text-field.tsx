import { forwardRef, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fontSize, maxFontScale, radius, space, touch } from '@/theme/tokens';
import { AppText } from './app-text';
import { useRevealOnFocus } from './keyboard-reveal';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  counter?: number;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, multiline, counter, value, editable = true, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const fieldRef = useRef<View>(null);
  const reveal = useRevealOnFocus();
  return (
    <View ref={fieldRef} style={styles.field}>
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
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textMuted}
          maxFontSizeMultiplier={maxFontScale}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(e) => {
            setFocused(true);
            reveal?.(fieldRef.current);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
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
  meta: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  metaText: { flex: 1 },
});
