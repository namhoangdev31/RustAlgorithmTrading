"use client"

import * as React from "react"
import { FieldApi } from "@tanstack/react-form"
import { Field, FieldLabel, FieldDescription, FieldError, FieldContent, FieldTitle, FieldSet, FieldLegend } from "./field"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"
import { Checkbox } from "./checkbox"
import { Switch } from "./switch"
import { RadioGroup, RadioGroupItem } from "./radio-group"

// Helper to safely format errors for FieldError component
function getFieldErrors(errors: any[]): Array<{ message?: string } | undefined> {
  return errors.map((err) => {
    if (typeof err === "string") {
      return { message: err }
    }
    if (err && typeof err === "object" && "message" in err) {
      return { message: String(err.message) }
    }
    if (err && typeof err === "object" && "errors" in err && Array.isArray(err.errors)) {
      return { message: String(err.errors[0]) }
    }
    return { message: String(err) }
  })
}

export interface FormInputFieldProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "onBlur"> {
  field: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
  label?: string
  description?: string
}

export function FormInputField({ field, label, description, ...props }: FormInputFieldProps) {
  const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const errorObjects = getFieldErrors(field.state.meta.errors)

  return (
    <Field data-invalid={isInvalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value as any)}
        aria-invalid={isInvalid}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errorObjects} />}
    </Field>
  )
}

export interface FormTextareaFieldProps extends Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange" | "onBlur"> {
  field: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
  label?: string
  description?: string
}

export function FormTextareaField({ field, label, description, ...props }: FormTextareaFieldProps) {
  const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const errorObjects = getFieldErrors(field.state.meta.errors)

  return (
    <Field data-invalid={isInvalid}>
      {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value ?? ""}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value as any)}
        aria-invalid={isInvalid}
        {...props}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={errorObjects} />}
    </Field>
  )
}

export interface FormSelectFieldProps extends Omit<React.ComponentProps<typeof Select>, "value" | "onValueChange"> {
  field: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
  label?: string
  description?: string
  placeholder?: string
  options: { label: string; value: string }[]
  orientation?: "vertical" | "horizontal" | "responsive"
}

export function FormSelectField({
  field,
  label,
  description,
  placeholder = "Select...",
  options,
  orientation = "vertical",
  ...props
}: FormSelectFieldProps) {
  const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const errorObjects = getFieldErrors(field.state.meta.errors)
  const triggerId = `${field.name}-trigger`

  return (
    <Field orientation={orientation} data-invalid={isInvalid}>
      {orientation === "responsive" || orientation === "horizontal" ? (
        <FieldContent>
          {label && <FieldLabel htmlFor={triggerId}>{label}</FieldLabel>}
          {description && <FieldDescription>{description}</FieldDescription>}
          {isInvalid && <FieldError errors={errorObjects} />}
        </FieldContent>
      ) : (
        label && <FieldLabel htmlFor={triggerId}>{label}</FieldLabel>
      )}

      <Select
        name={field.name}
        value={field.state.value ?? ""}
        onValueChange={field.handleChange}
        {...props}
      >
        <SelectTrigger id={triggerId} aria-invalid={isInvalid}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {orientation === "vertical" && description && (
        <FieldDescription>{description}</FieldDescription>
      )}
      {orientation === "vertical" && isInvalid && (
        <FieldError errors={errorObjects} />
      )}
    </Field>
  )
}

export interface FormSwitchFieldProps extends Omit<React.ComponentProps<typeof Switch>, "checked" | "onCheckedChange"> {
  field: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
  label: string
  description?: string
}

export function FormSwitchField({ field, label, description, ...props }: FormSwitchFieldProps) {
  const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const errorObjects = getFieldErrors(field.state.meta.errors)
  const id = field.name

  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={errorObjects} />}
      </FieldContent>
      <Switch
        id={id}
        name={field.name}
        checked={!!field.state.value}
        onCheckedChange={field.handleChange}
        aria-invalid={isInvalid}
        {...props}
      />
    </Field>
  )
}

export interface FormCheckboxFieldProps extends Omit<React.ComponentProps<typeof Checkbox>, "checked" | "onCheckedChange"> {
  field: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
  label: string
  description?: string
}

export function FormCheckboxField({ field, label, description, ...props }: FormCheckboxFieldProps) {
  const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const errorObjects = getFieldErrors(field.state.meta.errors)
  const id = field.name

  return (
    <Field orientation="horizontal" data-invalid={isInvalid}>
      <Checkbox
        id={id}
        name={field.name}
        checked={!!field.state.value}
        onCheckedChange={field.handleChange}
        aria-invalid={isInvalid}
        {...props}
      />
      <div className="grid gap-1.5 leading-none">
        <FieldLabel htmlFor={id} className="font-normal cursor-pointer">
          {label}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={errorObjects} />}
      </div>
    </Field>
  )
}

export interface FormRadioGroupFieldProps extends Omit<React.ComponentProps<typeof RadioGroup>, "value" | "onValueChange"> {
  field: FieldApi<any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any, any>
  label: string
  description?: string
  options: { label: string; value: string; description?: string }[]
}

export function FormRadioGroupField({
  field,
  label,
  description,
  options,
  ...props
}: FormRadioGroupFieldProps) {
  const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const errorObjects = getFieldErrors(field.state.meta.errors)

  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      {description && <FieldDescription className="mb-3">{description}</FieldDescription>}
      <RadioGroup
        name={field.name}
        value={field.state.value ?? ""}
        onValueChange={field.handleChange}
        {...props}
      >
        {options.map((opt) => {
          const optId = `${field.name}-${opt.value}`
          return (
            <FieldLabel key={opt.value} htmlFor={optId} className="font-normal cursor-pointer">
              <Field orientation="horizontal" data-invalid={isInvalid}>
                <FieldContent>
                  <FieldTitle>{opt.label}</FieldTitle>
                  {opt.description && <FieldDescription>{opt.description}</FieldDescription>}
                </FieldContent>
                <RadioGroupItem
                  value={opt.value}
                  id={optId}
                  aria-invalid={isInvalid}
                />
              </Field>
            </FieldLabel>
          )
        })}
      </RadioGroup>
      {isInvalid && <FieldError errors={errorObjects} className="mt-2" />}
    </FieldSet>
  )
}
