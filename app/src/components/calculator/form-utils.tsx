// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormInstance = any;
import type { InputHTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export type FormValues = {
  area: number;
  ceilingHeight: number;
  wallArea: number;
  wallR: number;
  roofArea: number;
  roofR: number;
  windowArea: number;
  windowU: number;
  windowSHGC: number;
  infiltrationClass: "tight" | "average" | "loose";
  occupants: number;
  lighting: number;
  appliances: number;
  ductLocation: "conditioned" | "unconditioned";
  ductEfficiency: number;
  indoorTemp: number;
};

export type FieldValidators = Record<keyof FormValues, any>;

// Helper to extract error message from Zod error or string
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "Invalid value";
};

export const renderNumberField = (
  form: FormInstance,
  fieldValidators: FieldValidators,
  name: keyof FormValues,
  label: string,
  description?: string,
  props?: InputHTMLAttributes<HTMLInputElement>
) => {
  return (
    <form.Field name={name} validators={{ onChange: fieldValidators[name] }}>
      {(field: any) => {
        const defaultValue = form.options.defaultValues?.[name] ?? 0;
        const formValue = field.state.value ?? defaultValue;

        return (
          <NumberInputField
            field={field}
            formValue={formValue}
            defaultValue={defaultValue}
            name={String(name)}
            label={label}
            description={description}
            props={props}
          />
        );
      }}
    </form.Field>
  );
};

// Separate component to manage local input state
function NumberInputField({
  field,
  formValue,
  defaultValue,
  name,
  label,
  description,
  props,
}: {
  field: any;
  formValue: number;
  defaultValue: number;
  name: string;
  label: string;
  description?: string;
  props?: InputHTMLAttributes<HTMLInputElement>;
}) {
  const [localValue, setLocalValue] = useState<string>(String(formValue));
  const [isFocused, setIsFocused] = useState(false);

  // Sync local value when form value changes externally (when not focused)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(formValue));
    }
  }, [formValue, isFocused]);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        value={isFocused ? localValue : String(formValue)}
        onChange={(event) => {
          try {
            const value = event.target.value;
            setLocalValue(value);

            // Allow empty, minus, decimal point, or scientific notation during typing
            if (
              value === "" ||
              value === "-" ||
              value === "." ||
              value === "-." ||
              value === "e" ||
              value === "E" ||
              value === "+" ||
              value === "e+" ||
              value === "E+"
            ) {
              // Don't update form value yet, let user continue typing
              return;
            }

            // Update form value if it's a valid number
            const numValue = Number(value);
            if (!isNaN(numValue) && isFinite(numValue)) {
              field.handleChange(numValue);
            }
          } catch (error) {
            // Silently handle any errors during input
            console.debug("Input error handled:", error);
          }
        }}
        onFocus={() => {
          setIsFocused(true);
          setLocalValue(String(formValue));
        }}
        onBlur={(event) => {
          try {
            setIsFocused(false);
            const value = event.target.value;

            // On blur, ensure we have a valid value
            if (
              value === "" ||
              value === "-" ||
              value === "." ||
              value === "-." ||
              isNaN(Number(value)) ||
              !isFinite(Number(value))
            ) {
              field.handleChange(defaultValue);
              setLocalValue(String(defaultValue));
            } else {
              const numValue = Number(value);
              if (!isNaN(numValue) && isFinite(numValue)) {
                field.handleChange(numValue);
                setLocalValue(String(numValue));
              } else {
                field.handleChange(defaultValue);
                setLocalValue(String(defaultValue));
              }
            }
            field.handleBlur();
          } catch (error) {
            // Fallback to default value on any error
            field.handleChange(defaultValue);
            setLocalValue(String(defaultValue));
            field.handleBlur();
          }
        }}
        className="w-full"
        {...props}
      />
      {description && <p className="text-xs text-gray-400">{description}</p>}
      {field.state.meta.errors?.[0] && (
        <p className="text-sm text-destructive">
          {getErrorMessage(field.state.meta.errors[0])}
        </p>
      )}
    </div>
  );
}

export interface FormSectionProps {
  form: FormInstance;
  fieldValidators: FieldValidators;
}
