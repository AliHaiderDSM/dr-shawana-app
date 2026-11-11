import { Check, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { ChoiceChips, Notice } from '@/components/ui/bits';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { errorMessage, fieldErrors } from '@/lib/errors';
import {
  bmiOf,
  feetInput,
  type IntakeField,
  type IntakePart,
  type IntakeValues,
  missing,
  numberInput,
  toApi,
  toggleCheck,
  toValues,
  visible,
} from '@/lib/intake-fields';
import { useSaveIntakeMutation } from '@/redux/features/intake';
import { colors, icon, radius, space } from '@/theme/tokens';

function CheckRow({
  label,
  checked,
  disabled,
  onPress,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={[styles.check, checked && styles.checkOn]}
    >
      <View style={[styles.box, checked && styles.boxOn]}>
        {checked ? <Check size={icon.sm} color={colors.textInverse} /> : null}
      </View>
      <AppText variant="label" style={styles.flex}>
        {label}
      </AppText>
    </Pressable>
  );
}

function FieldInput({
  field,
  values,
  error,
  disabled,
  onChange,
}: {
  field: IntakeField;
  values: IntakeValues;
  error?: string;
  disabled: boolean;
  onChange: (key: string, value: string | string[]) => void;
}) {
  const label = field.required ? `${field.label} *` : field.label;
  const value = values[field.key];
  switch (field.kind) {
    case 'bmi': {
      const bmi = bmiOf(values);
      return (
        <View style={styles.bmi}>
          <AppText variant="label" tone="muted">
            Body mass index
          </AppText>
          <AppText variant="subheading">
            {bmi ? `${bmi.value} · ${bmi.label}` : 'Enter weight and height'}
          </AppText>
        </View>
      );
    }
    case 'choice':
      return (
        <ChoiceChips
          label={label}
          options={field.options.map(([v, l]) => ({ value: v, label: l }))}
          value={typeof value === 'string' && value ? value : undefined}
          onChange={(next) => !disabled && onChange(field.key, next === value ? '' : next)}
          error={error}
        />
      );
    case 'checks': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <View style={styles.checks}>
          <AppText variant="label">{label}</AppText>
          {field.groups.map((group, index) => {
            const groupValues = group.options.map(([v]) => v);
            return (
              <View key={group.title ?? index} style={styles.group}>
                {group.title ? (
                  <AppText variant="label" weight="semibold" tone="primary">
                    {group.title}
                  </AppText>
                ) : null}
                {group.options.map(([v, l]) => (
                  <CheckRow
                    key={v}
                    label={l}
                    checked={selected.includes(v)}
                    disabled={disabled}
                    onPress={() => onChange(field.key, toggleCheck(selected, v, groupValues))}
                  />
                ))}
              </View>
            );
          })}
          {error ? (
            <AppText variant="caption" tone="danger">
              {error}
            </AppText>
          ) : null}
        </View>
      );
    }
    case 'number':
      return (
        <TextField
          label={label}
          hint={field.hint}
          value={typeof value === 'string' ? value : ''}
          keyboardType={field.integer || field.feet ? 'number-pad' : 'decimal-pad'}
          editable={!disabled}
          error={error}
          onChangeText={(raw) =>
            onChange(field.key, field.feet ? feetInput(raw) : numberInput(raw, field.integer))
          }
        />
      );
    default:
      return (
        <TextField
          label={label}
          value={typeof value === 'string' ? value : ''}
          multiline={field.multiline}
          editable={!disabled}
          error={error}
          maxLength={field.multiline ? 5000 : 255}
          onChangeText={(next) => onChange(field.key, next)}
        />
      );
  }
}

export function IntakeCard({
  part,
  data,
  defaults,
  editable,
}: {
  part: IntakePart;
  data: Record<string, unknown> | null;
  defaults?: Record<string, unknown>;
  editable: boolean;
}) {
  const [values, setValues] = useState<IntakeValues>(() => toValues(part, data, defaults));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, { isLoading }] = useSaveIntakeMutation();

  const onChange = (key: string, value: string | string[]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async () => {
    const empty = missing(part, values);
    if (empty.length) {
      setErrors(Object.fromEntries(empty.map((key) => [key, 'Required'])));
      return;
    }
    try {
      await save({ key: part.key, data: toApi(part, values) }).unwrap();
      setErrors({});
      Alert.alert('Saved', `${part.title} is saved. Your doctor can see it now.`);
    } catch (error) {
      const byField = fieldErrors(error);
      setErrors(byField);
      if (Object.keys(byField).length === 0) Alert.alert('Could not save', errorMessage(error));
    }
  };

  return (
    <Card>
      <AppText variant="subheading">{part.title}</AppText>
      <View style={styles.fields}>
        {part.fields
          .filter((f) => visible(f, values))
          .map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              values={values}
              error={errors[f.key]}
              disabled={!editable || isLoading}
              onChange={onChange}
            />
          ))}
      </View>
      {Object.keys(errors).length ? (
        <Notice tone="warning">Please check the fields marked above.</Notice>
      ) : null}
      {editable ? (
        <Button
          label={`Save ${part.title.toLowerCase()}`}
          icon={Save}
          loading={isLoading}
          onPress={() => void submit()}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  fields: { gap: space.md },
  checks: { gap: space.sm },
  group: { gap: space.xs },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  bmi: {
    gap: space.xxs,
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
});
