"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { FormInputField, FormTextareaField } from "@/components/ui/tanstack-form"
import { updateProfileAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2, Mail, UserCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../layout/card"
import { Separator } from "@/components/ui/separator"

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

  const form = useForm({
    defaultValues: {
      fullName: user?.fullName ?? user?.email?.split("@")[0] ?? "",
      bio: "",
      urlPrimary: "",
      urlSecondary: "",
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

  if (!user) {
    return null;
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-muted">
            <UserCircle2 className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <CardTitle>{t("profile.title")}</CardTitle>
            <CardDescription>{t("profile.description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="flex flex-col gap-6"
        >
          <section className="grid gap-4">
            <form.Field name="fullName">
              {(field) => (
                <FormInputField
                  field={field}
                  label={t("profile.username_label")}
                  placeholder={t("profile.username_placeholder")}
                  description={t("profile.username_desc")}
                />
              )}
            </form.Field>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t("profile.email_label")}</span>
              <Select defaultValue={user.email || "m@example.com"} disabled>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={user.email || "m@example.com"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user.email || "m@example.com"}>
                    {user.email || "m@example.com"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                {t("profile.email_desc")}
              </span>
            </div>
          </section>

          <Separator />

          <section className="grid gap-4">
            <form.Field name="bio">
              {(field) => (
                <FormTextareaField
                  field={field}
                  label={t("profile.bio_label")}
                  className="min-h-28 resize-y"
                  placeholder={t("profile.bio_placeholder")}
                  description={t("profile.bio_desc")}
                />
              )}
            </form.Field>
          </section>

          <Separator />

          <section className="grid gap-4">
            <form.Field name="urlPrimary">
              {(field) => (
                <FormInputField
                  field={field}
                  label={t("profile.urls_label")}
                  placeholder={t("profile.urls_primary_placeholder")}
                  description={t("profile.urls_desc")}
                />
              )}
            </form.Field>

            <form.Field name="urlSecondary">
              {(field) => (
                <FormInputField
                  field={field}
                  placeholder={t("profile.urls_secondary_placeholder")}
                />
              )}
            </form.Field>
          </section>

          <Button className="w-fit" type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("profile.update_profile_btn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
