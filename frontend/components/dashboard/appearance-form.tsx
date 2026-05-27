"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { FormSelectField } from "@/components/ui/tanstack-form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { updateDisplayPreferenceAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

const appearanceFormSchema = z.object({
  font: z.string(),
  theme: z.enum(["light", "dark"]),
})

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>

interface AppearanceFormProps {
  initialTheme?: string
}

export function AppearanceForm({ initialTheme = "light" }: AppearanceFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const t = useTranslations("Settings")

  const form = useForm({
    defaultValues: {
      font: "inter",
      theme: (initialTheme === "dark" ? "dark" : "light") as "light" | "dark",
    } as AppearanceFormValues,
    validators: {
      onSubmit: appearanceFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append("density", "comfortable")
        formData.append("theme", value.theme)
        formData.append("returnTo", "/dashboard/settings/appearance")

        await updateDisplayPreferenceAction(formData)
        toast.success(t("appearance.success_msg"))
      } catch (error) {
        toast.error(t("appearance.error_msg"))
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
      className="-mx-1 flex max-w-xl flex-col gap-8 px-1.5"
    >
      <form.Field
        name="font"
        children={(field) => (
          <FormSelectField
            field={field}
            label={t("appearance.font_label")}
            placeholder={t("appearance.font_placeholder")}
            options={[
              { label: "inter", value: "inter" },
              { label: "manrope", value: "manrope" },
              { label: "system", value: "system" },
            ]}
            description={t("appearance.font_desc")}
          />
        )}
      />

      <div className="grid gap-2 text-sm">
        <div>{t("appearance.theme_label")}</div>
        <p className="text-sm text-muted-foreground">
          {t("appearance.theme_desc")}
        </p>

        <form.Field
          name="theme"
          children={(field) => (
            <RadioGroup
              className="grid max-w-md grid-cols-2 gap-8 pt-2"
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as "light" | "dark")}
            >
              <label className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                <RadioGroupItem className="sr-only" value="light" />
                <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                  <div className="flex flex-col gap-2 rounded-sm bg-[#ecedef] p-2">
                    <div className="flex flex-col gap-2 rounded-md bg-white p-2 shadow-xs">
                      <div className="h-2 w-20 rounded-lg bg-[#ecedef]" />
                      <div className="h-2 w-[6.25rem] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-xs">
                      <div className="size-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[6.25rem] rounded-lg bg-[#ecedef]" />
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-xs">
                      <div className="size-4 rounded-full bg-[#ecedef]" />
                      <div className="h-2 w-[6.25rem] rounded-lg bg-[#ecedef]" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  {t("appearance.theme_light")}
                </span>
              </label>

              <label className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                <RadioGroupItem className="sr-only" value="dark" />
                <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                  <div className="flex flex-col gap-2 rounded-sm bg-slate-950 p-2">
                    <div className="flex flex-col gap-2 rounded-md bg-slate-800 p-2 shadow-xs">
                      <div className="h-2 w-20 rounded-lg bg-slate-400" />
                      <div className="h-2 w-[6.25rem] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-slate-800 p-2 shadow-xs">
                      <div className="size-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[6.25rem] rounded-lg bg-slate-400" />
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-slate-800 p-2 shadow-xs">
                      <div className="size-4 rounded-full bg-slate-400" />
                      <div className="h-2 w-[6.25rem] rounded-lg bg-slate-400" />
                    </div>
                  </div>
                </div>
                <span className="block w-full p-2 text-center font-normal">
                  {t("appearance.theme_dark")}
                </span>
              </label>
            </RadioGroup>
          )}
        />
      </div>

      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("appearance.update_preferences_btn")}
      </Button>
    </form>
  )
}

