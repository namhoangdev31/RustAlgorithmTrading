"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { FormRadioGroupField, FormSwitchField, FormCheckboxField } from "@/components/ui/tanstack-form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

const notificationsFormSchema = z.object({
  type: z.enum(["all", "mentions", "none"]),
  communication_emails: z.boolean(),
  marketing_emails: z.boolean(),
  social_emails: z.boolean(),
  security_emails: z.boolean(),
  mobile: z.boolean(),
})

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>

export function NotificationsForm() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const t = useTranslations("Settings")

  const form = useForm({
    defaultValues: {
      type: "mentions",
      communication_emails: false,
      marketing_emails: false,
      social_emails: true,
      security_emails: true,
      mobile: false,
    } as NotificationsFormValues,
    validators: {
      onSubmit: notificationsFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        toast.success(t("notifications.success_msg"))
      } catch (error) {
        toast.error(t("notifications.error_msg"))
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
        name="type"
        children={(field) => (
          <FormRadioGroupField
            field={field}
            label={t("notifications.notify_me_label")}
            options={[
              { label: t("notifications.option_all"), value: "all" },
              { label: t("notifications.option_mentions"), value: "mentions" },
              { label: t("notifications.option_none"), value: "none" },
            ]}
          />
        )}
      />

      <div className="relative">
        <h3 className="mb-4 text-lg font-medium">{t("notifications.email_notifications_title")}</h3>
        <div className="flex flex-col gap-4">
          <form.Field
            name="communication_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label={t("notifications.comm_emails_label")}
                description={t("notifications.comm_emails_desc")}
              />
            )}
          />

          <form.Field
            name="marketing_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label={t("notifications.mkt_emails_label")}
                description={t("notifications.mkt_emails_desc")}
              />
            )}
          />

          <form.Field
            name="social_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label={t("notifications.social_emails_label")}
                description={t("notifications.social_emails_desc")}
              />
            )}
          />

          <form.Field
            name="security_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label={t("notifications.security_emails_label")}
                description={t("notifications.security_emails_desc")}
                disabled
              />
            )}
          />
        </div>
      </div>

      <form.Field
        name="mobile"
        children={(field) => (
          <FormCheckboxField
            field={field}
            label={t("notifications.mobile_label")}
            description={t("notifications.mobile_desc")}
          />
        )}
      />

      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("notifications.update_notifications_btn")}
      </Button>
    </form>
  )
}

