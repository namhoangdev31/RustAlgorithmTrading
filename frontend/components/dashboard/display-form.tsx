"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { FormSelectField } from "@/components/ui/tanstack-form"
import { updateDisplayPreferenceAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

const displayFormSchema = z.object({
  density: z.enum(["comfortable", "compact", "spacious"]),
})

type DisplayFormValues = z.infer<typeof displayFormSchema>

interface DisplayFormProps {
  initialDensity?: string
  initialTheme?: string
}

export function DisplayForm({ initialDensity = "comfortable", initialTheme = "light" }: DisplayFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const t = useTranslations("Settings")

  const form = useForm({
    defaultValues: {
      density: (initialDensity === "compact" || initialDensity === "spacious" || initialDensity === "comfortable" ? initialDensity : "comfortable") as "comfortable" | "compact" | "spacious",
    } as DisplayFormValues,
    validators: {
      onSubmit: displayFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append("density", value.density)
        formData.append("theme", initialTheme)
        formData.append("returnTo", "/dashboard/settings/display")

        await updateDisplayPreferenceAction(formData)
        toast.success(t("display.success_msg"))
      } catch (error) {
        toast.error(t("display.error_msg"))
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-4"
    >
      <form.Field
        name="density"
        children={(field) => (
          <FormSelectField
            field={field}
            label={t("display.density_label")}
            placeholder={t("display.density_placeholder")}
            options={[
              { label: t("display.density_comfortable"), value: "comfortable" },
              { label: t("display.density_compact"), value: "compact" },
              { label: t("display.density_spacious"), value: "spacious" },
            ]}
          />
        )}
      />
      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("display.save_display_btn")}
      </Button>
    </form>
  )
}

