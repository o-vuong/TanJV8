// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormInstance = any;
import { Home, Square, Wind, Users, Gauge, Thermometer } from "lucide-react";
import type { ComponentType, InputHTMLAttributes, ReactNode } from "react";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Field, FieldLabel, FieldDescription, FieldError } from "../ui/field";

type SectionIcon = ComponentType<{ className?: string }>;

function FormSectionShell(props: {
  icon: SectionIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const Icon = props.icon;

  return (
    <section className="space-y-4 p-5 rounded-lg bg-slate-800/30 border border-slate-700/50">
      <div className="flex items-center gap-2 text-white font-semibold">
        <Icon className="w-5 h-5 text-blue-400" />
        <h3>{props.title}</h3>
      </div>

      <div className="grid grid-cols-12 gap-4 @container">
        <div className="col-span-12">
          <p className="not-first:mt-6 text-sm text-gray-400 ml-7">
            {props.description}
          </p>
        </div>

        {props.children}
      </div>
    </section>
  );
}

// Helper to extract error message from Zod error or string
const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Invalid value";
};

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

interface FormSectionProps {
  form: FormInstance;
  fieldValidators: FieldValidators;
}

const renderNumberField = (
  form: FormInstance,
  fieldValidators: FieldValidators,
  name: keyof FormValues,
  label: string,
  description?: string,
  props?: InputHTMLAttributes<HTMLInputElement>,
) => (
  <form.Field name={name} validators={{ onChange: fieldValidators[name] }}>
    {(field: any) => {
      const defaultValue = form.options.defaultValues?.[name] ?? 0;
      const displayValue = field.state.value ?? defaultValue;

      const error = field.state.meta.errors?.[0];
      const hasError = Boolean(error);
      const errorObject = hasError
        ? { message: getErrorMessage(error) }
        : undefined;

      return (
        <Field
          className="flex flex-col gap-2 space-y-0 items-start"
          data-invalid={hasError}
        >
          <FieldLabel>{label}</FieldLabel>
          <Input
            id={String(name)}
            type="number"
            value={displayValue}
            onChange={(event) => {
              try {
                const value = event.target.value;
                // Allow empty, minus, or decimal point during typing
                if (value === "" || value === "-" || value === "." || value === "-.") {
                  // Don't update form value yet, let user continue typing
                  return;
                }
                // Handle scientific notation and other edge cases
                if (value === "e" || value === "E" || value === "+" || value === "e+" || value === "E+") {
                  return;
                }
                const numValue = Number(value);
                // Only update if it's a valid finite number
                if (!isNaN(numValue) && isFinite(numValue)) {
                  field.handleChange(numValue);
                }
              } catch (error) {
                // Silently handle any errors during input
                console.debug("Input error handled:", error);
              }
            }}
            onBlur={(event) => {
              try {
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
                } else {
                  const numValue = Number(value);
                  if (!isNaN(numValue) && isFinite(numValue)) {
                    field.handleChange(numValue);
                  } else {
                    field.handleChange(defaultValue);
                  }
                }
                field.handleBlur();
              } catch (error) {
                // Fallback to default value on any error
                field.handleChange(defaultValue);
                field.handleBlur();
              }
            }}
            className="w-full"
            {...props}
          />
          {description && <FieldDescription>{description}</FieldDescription>}
          {hasError && errorObject && <FieldError errors={[errorObject]} />}
        </Field>
      );
    }}
  </form.Field>
);

export function BuildingDimensionsSection({
  form,
  fieldValidators,
}: FormSectionProps) {
  return (
    <FormSectionShell
      icon={Home}
      title="Building dimensions"
      description="Enter the overall size and height of your building"
    >
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "area",
          "Floor Area",
          "Total floor area of the building in square feet",
          { min: 1 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "ceilingHeight",
          "Ceiling Height",
          "Average ceiling height in feet",
          { min: 1 },
        )}
      </div>
    </FormSectionShell>
  );
}

export function BuildingEnvelopeSection({
  form,
  fieldValidators,
}: FormSectionProps) {
  return (
    <FormSectionShell
      icon={Square}
      title="Building envelope"
      description="Enter the areas and performance values for walls, roof, and windows"
    >
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "wallArea",
          "Wall Area",
          "Total exterior wall area in square feet",
          { min: 0 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "wallR",
          "Wall R-Value",
          "Thermal resistance of walls (higher is better)",
          { min: 1, step: 0.1 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "roofArea",
          "Roof Area",
          "Total roof/ceiling area in square feet",
          { min: 0 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "roofR",
          "Roof R-Value",
          "Thermal resistance of roof (higher is better)",
          { min: 1, step: 0.1 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "windowArea",
          "Window Area",
          "Total window area in square feet",
          { min: 0 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "windowU",
          "Window U-Factor",
          "Window heat transfer coefficient (lower is better, typically 0.2-1.0)",
          { step: 0.01, min: 0.01, max: 2 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "windowSHGC",
          "Window SHGC",
          "Solar Heat Gain Coefficient (0-1, lower reduces solar heat gain)",
          { step: 0.05, min: 0, max: 1 },
        )}
      </div>
    </FormSectionShell>
  );
}

export function InfiltrationSection({
  form,
  fieldValidators,
}: FormSectionProps) {
  return (
    <FormSectionShell
      icon={Wind}
      title="Infiltration"
      description="Select the air tightness of the building envelope"
    >
      <div className="col-span-12 @5xl:col-span-6">
        <form.Field
          name="infiltrationClass"
          validators={{ onChange: fieldValidators.infiltrationClass }}
        >
          {(field) => {
            const error = field.state.meta.errors?.[0];
            const hasError = Boolean(error);
            const errorObject = hasError
              ? { message: getErrorMessage(error) }
              : undefined;

            return (
              <Field
                className="flex flex-col gap-2 space-y-0 items-start"
                data-invalid={hasError}
              >
                <FieldLabel>Infiltration Class</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as FormValues["infiltrationClass"])
                  }
                >
                  <SelectTrigger id="infiltrationClass">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Tight</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="loose">Loose</SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Air tightness of the building envelope
                </FieldDescription>
                {hasError && errorObject && (
                  <FieldError errors={[errorObject]} />
                )}
              </Field>
            );
          }}
        </form.Field>
      </div>
    </FormSectionShell>
  );
}

export function InternalGainsSection({
  form,
  fieldValidators,
}: FormSectionProps) {
  return (
    <FormSectionShell
      icon={Users}
      title="Internal gains"
      description="Enter the internal heat gains from people, lighting, and appliances"
    >
      <div className="col-span-12 @5xl:col-span-4">
        {renderNumberField(
          form,
          fieldValidators,
          "occupants",
          "Occupants",
          "Number of people in the building",
          { min: 0, step: 1 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-4">
        {renderNumberField(
          form,
          fieldValidators,
          "lighting",
          "Lighting",
          "Total lighting load in watts",
          { min: 0, step: 10 },
        )}
      </div>
      <div className="col-span-12 @5xl:col-span-4">
        {renderNumberField(
          form,
          fieldValidators,
          "appliances",
          "Appliances",
          "Total appliance load in watts",
          { min: 0, step: 10 },
        )}
      </div>
    </FormSectionShell>
  );
}

export function DuctSystemSection({ form, fieldValidators }: FormSectionProps) {
  return (
    <FormSectionShell
      icon={Gauge}
      title="Duct system"
      description="Select duct location and efficiency"
    >
      <div className="col-span-12 @5xl:col-span-6">
        <form.Field
          name="ductLocation"
          validators={{ onChange: fieldValidators.ductLocation }}
        >
          {(field) => {
            const error = field.state.meta.errors?.[0];
            const hasError = Boolean(error);
            const errorObject = hasError
              ? { message: getErrorMessage(error) }
              : undefined;

            return (
              <Field
                className="flex flex-col gap-2 space-y-0 items-start"
                data-invalid={hasError}
              >
                <FieldLabel>Duct Location</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as FormValues["ductLocation"])
                  }
                >
                  <SelectTrigger id="ductLocation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conditioned">
                      Conditioned space
                    </SelectItem>
                    <SelectItem value="unconditioned">
                      Unconditioned space
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Location of ductwork relative to conditioned space
                </FieldDescription>
                {hasError && errorObject && (
                  <FieldError errors={[errorObject]} />
                )}
              </Field>
            );
          }}
        </form.Field>
      </div>

      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "ductEfficiency",
          "Duct Efficiency",
          "Duct system efficiency (0-1, higher is better)",
          { step: 0.05, min: 0, max: 1 },
        )}
      </div>
    </FormSectionShell>
  );
}

export function ClimatePreferencesSection({
  form,
  fieldValidators,
}: FormSectionProps) {
  return (
    <FormSectionShell
      icon={Thermometer}
      title="Climate preferences"
      description="Set your preferred indoor design temperature"
    >
      <div className="col-span-12 @5xl:col-span-6">
        {renderNumberField(
          form,
          fieldValidators,
          "indoorTemp",
          "Indoor Temperature",
          "Desired indoor temperature in Fahrenheit",
          { min: 60, max: 80 },
        )}
      </div>
    </FormSectionShell>
  );
}
