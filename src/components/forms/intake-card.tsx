import { Check, ChevronDown, ChevronUp, Save } from 'lucide-react-native';
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
  dateInput,
  type FamilyEntry,
  feetInput,
  type IntakeField,
  type IntakePart,
  type IntakeValues,
  isNoneSurgery,
  numberInput,
  problems,
  type SurgeryEntry,
  toApi,
  toggleCheck,
  toggleSurgery,
  toValues,
  updateFamily,
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

function ErrorText({ error }: { error?: string }) {
  return error ? (
    <AppText variant="caption" tone="danger">
      {error}
    </AppText>
  ) : null;
}

function SurgeriesInput({
  field,
  value,
  error,
  disabled,
  onChange,
}: {
  field: Extract<IntakeField, { kind: 'surgeries' }>;
  value: SurgeryEntry[];
  error?: string;
  disabled: boolean;
  onChange: (next: SurgeryEntry[]) => void;
}) {
  return (
    <View style={styles.checks}>
      <AppText variant="label">{field.label}</AppText>
      {field.options.map(([type, label]) => {
        const entry = value.find((s) => s.type === type);
        return (
          <View key={type} style={styles.group}>
            <CheckRow
              label={label}
              checked={Boolean(entry)}
              disabled={disabled}
              onPress={() => onChange(toggleSurgery(value, type))}
            />
            {entry && !isNoneSurgery(type) ? (
              <TextField
                label={`${label}: year`}
                value={entry.year}
                keyboardType="number-pad"
                maxLength={4}
                editable={!disabled}
                placeholder="e.g. 2015"
                onChangeText={(year) =>
                  onChange(value.map((s) => (s.type === type ? { ...s, year: year.replace(/\D/g, '') } : s)))
                }
              />
            ) : null}
          </View>
        );
      })}
      <ErrorText error={error} />
    </View>
  );
}

function FamilyInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: Extract<IntakeField, { kind: 'family' }>;
  value: FamilyEntry[];
  disabled: boolean;
  onChange: (next: FamilyEntry[]) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const entryOf = (relative: string): FamilyEntry =>
    value.find((e) => e.relative === relative) ?? { relative, who: '', conditions: [], other: '' };
  const save = (next: FamilyEntry) => onChange(updateFamily(value, field.relatives, next));
  return (
    <View style={styles.checks}>
      <AppText variant="label">{field.label}</AppText>
      <AppText variant="caption" tone="muted">
        Open a family member and tick the conditions they had.
      </AppText>
      {field.relatives.map(([relative, label]) => {
        const entry = entryOf(relative);
        const expanded = open === relative;
        const count = entry.conditions.length;
        const Chevron = expanded ? ChevronUp : ChevronDown;
        return (
          <View key={relative} style={[styles.family, count > 0 && styles.familyOn]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={`${label}, ${count ? `${count} selected` : 'none selected'}`}
              onPress={() => setOpen(expanded ? null : relative)}
              style={styles.familyHead}
            >
              <View style={styles.flex}>
                <AppText weight="semibold">{label}</AppText>
                <AppText variant="caption" tone={count ? 'primary' : 'muted'}>
                  {count ? `${count} selected` : 'None'}
                </AppText>
              </View>
              <Chevron size={icon.md} color={colors.textMuted} />
            </Pressable>
            {expanded ? (
              <View style={styles.group}>
                {relative === 'close_family' ? (
                  <TextField
                    label="Who?"
                    placeholder="e.g. aunt"
                    value={entry.who}
                    maxLength={100}
                    editable={!disabled}
                    onChangeText={(who) => save({ ...entry, who })}
                  />
                ) : null}
                {field.conditions.map(([condition, conditionLabel]) => {
                  const checked = entry.conditions.includes(condition);
                  return (
                    <View key={condition} style={styles.group}>
                      <CheckRow
                        label={conditionLabel}
                        checked={checked}
                        disabled={disabled}
                        onPress={() =>
                          save({
                            ...entry,
                            conditions: checked
                              ? entry.conditions.filter((c) => c !== condition)
                              : [...entry.conditions, condition],
                            other: condition === 'other' && checked ? '' : entry.other,
                          })
                        }
                      />
                      {condition === 'other' && checked ? (
                        <TextField
                          label="Which?"
                          value={entry.other}
                          maxLength={500}
                          editable={!disabled}
                          onChangeText={(other) => save({ ...entry, other })}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
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
  onChange: (key: string, value: unknown) => void;
}) {
  const label = field.required ? `${field.label} *` : field.label;
  const value = values[field.key];
  const str = typeof value === 'string' ? value : '';
  switch (field.kind) {
    case 'heading':
      return (
        <View style={styles.heading}>
          <AppText variant="subheading" tone="primary">
            {field.label}
          </AppText>
          {field.hint ? (
            <AppText variant="label" tone="muted">
              {field.hint}
            </AppText>
          ) : null}
        </View>
      );
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
    case 'bool':
      return (
        <CheckRow
          label={field.label}
          checked={value === true}
          disabled={disabled}
          onPress={() => onChange(field.key, value !== true)}
        />
      );
    case 'choice':
      return (
        <ChoiceChips
          label={label}
          options={field.options.map(([v, l]) => ({ value: v, label: l }))}
          value={str || undefined}
          onChange={(next) => !disabled && onChange(field.key, next === str ? '' : next)}
          error={error}
        />
      );
    case 'checks': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
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
          <ErrorText error={error} />
        </View>
      );
    }
    case 'surgeries':
      return (
        <SurgeriesInput
          field={field}
          value={Array.isArray(value) ? (value as SurgeryEntry[]) : []}
          error={error}
          disabled={disabled}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case 'family':
      return (
        <FamilyInput
          field={field}
          value={Array.isArray(value) ? (value as FamilyEntry[]) : []}
          disabled={disabled}
          onChange={(next) => onChange(field.key, next)}
        />
      );
    case 'date':
      return (
        <TextField
          label={label}
          hint={field.hint}
          placeholder="DD-MM-YYYY"
          value={str}
          keyboardType="number-pad"
          editable={!disabled}
          error={error}
          onChangeText={(raw) => onChange(field.key, dateInput(raw))}
        />
      );
    case 'number':
      return (
        <TextField
          label={label}
          hint={field.hint}
          value={str}
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
          value={str}
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

  const onChange = (key: string, value: unknown) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async () => {
    const found = problems(part, values);
    if (Object.keys(found).length) {
      setErrors(found);
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
  heading: {
    gap: space.xxs,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
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
  family: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    gap: space.sm,
  },
  familyOn: { borderColor: colors.primary },
  familyHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
