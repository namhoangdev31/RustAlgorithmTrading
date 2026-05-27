"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { FormInputField, FormTextareaField } from "@/components/ui/tanstack-form"
import { updateProfileAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProfileFormProps {
  user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const t = useTranslations("Settings")

  const profileFormSchema = React.useMemo(() => {
    return z.object({
      fullName: z.string()
        .min(2, t("profile.validation.username_min"))
        .max(50, t("profile.validation.username_max")),
      bio: z.string().max(160, t("profile.validation.bio_max")).optional(),
      urlPrimary: z.string().url(t("profile.validation.url_invalid")).or(z.literal("")).optional(),
      urlSecondary: z.string().url(t("profile.validation.url_invalid")).or(z.literal("")).optional(),
    })
  }, [t])

  type ProfileFormValues = z.infer<typeof profileFormSchema>

  if (!user) {
    return null;
  }

  const form = useForm({
    defaultValues: {
      fullName: user.fullName ?? user.email?.split("@")[0] ?? "",
      bio: "I own a computer.",
      urlPrimary: "https://shadcn.com",
      urlSecondary: "http://twitter.com/shadcn",
    } as ProfileFormValues,
    validators: {
      onSubmit: profileFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append("fullName", value.fullName || "")
        formData.append("bio", value.bio || "")
        formData.append("urlPrimary", value.urlPrimary || "")
        formData.append("urlSecondary", value.urlSecondary || "")
        formData.append("firstName", user.firstName || "")
        formData.append("lastName", user.lastName || "")
        formData.append("phone", user.phone || "")
        formData.append("gender", user.gender || "")
        formData.append("returnTo", "/dashboard/settings")

        await updateProfileAction(formData)
        toast.success(t("profile.success_msg"))
      } catch (error) {
        toast.error(t("profile.error_msg"))
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
        name="fullName"
        children={(field) => (
          <FormInputField
            field={field}
            label={t("profile.username_label")}
            placeholder={t("profile.username_placeholder")}
            description={t("profile.username_desc")}
          />
        )}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("profile.email_label")}</span>
        <Select
          defaultValue={user.email || "m@example.com"}
          disabled
        >
          <SelectTrigger className="h-10">
            <SelectValue placeholder={user.email || "m@example.com"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={user.email || "m@example.com"}>{user.email || "m@example.com"}</SelectItem>
            <SelectItem value="m@google.com">m@google.com</SelectItem>
            <SelectItem value="m@support.com">m@support.com</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {t("profile.email_desc")}
        </span>
      </div>

      <form.Field
        name="bio"
        children={(field) => (
          <FormTextareaField
            field={field}
            label={t("profile.bio_label")}
            className="resize-none"
            placeholder={t("profile.bio_placeholder")}
            description={t("profile.bio_desc")}
          />
        )}
      />

      <div className="flex flex-col gap-2">
        <form.Field
          name="urlPrimary"
          children={(field) => (
            <FormInputField
              field={field}
              label={t("profile.urls_label")}
              placeholder={t("profile.urls_primary_placeholder")}
              description={t("profile.urls_desc")}
            />
          )}
        />

        <form.Field
          name="urlSecondary"
          children={(field) => (
            <FormInputField
              field={field}
              placeholder={t("profile.urls_secondary_placeholder")}
            />
          )}
        />
      </div>

      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("profile.update_profile_btn")}
      </Button>
    </form>
  )
}

