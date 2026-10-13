import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { TextField, type TextFieldProps } from './text-field';

interface FormFieldProps<T extends FieldValues> extends Omit<
  TextFieldProps,
  'value' | 'onChangeText' | 'error'
> {
  control: Control<T>;
  name: FieldPath<T>;
  sanitize?: (value: string) => string;
}

export function FormField<T extends FieldValues>({ control, name, sanitize, ...props }: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          ref={field.ref}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={(text) => field.onChange(sanitize ? sanitize(text) : text)}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
