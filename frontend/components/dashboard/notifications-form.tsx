"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { FormRadioGroupField, FormSwitchField, FormCheckboxField } from "@/components/ui/tanstack-form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
        toast.success("Notifications preferences updated successfully")
      } catch (error) {
        toast.error("Failed to update notification settings")
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
            label="Notify me about..."
            options={[
              { label: "All new messages", value: "all" },
              { label: "Direct messages and mentions", value: "mentions" },
              { label: "Nothing", value: "none" },
            ]}
          />
        )}
      />

      <div className="relative">
        <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
        <div className="flex flex-col gap-4">
          <form.Field
            name="communication_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label="Communication emails"
                description="Receive emails about your account activity."
              />
            )}
          />

          <form.Field
            name="marketing_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label="Marketing emails"
                description="Receive emails about new products, features, and more."
              />
            )}
          />

          <form.Field
            name="social_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label="Social emails"
                description="Receive emails for friend requests, follows, and more."
              />
            )}
          />

          <form.Field
            name="security_emails"
            children={(field) => (
              <FormSwitchField
                field={field}
                label="Security emails"
                description="Receive emails about your account activity and security."
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
            label="Use different settings for my mobile devices"
            description="You can manage your mobile notifications in the mobile settings page."
          />
        )}
      />

      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update notifications
      </Button>
    </form>
  )
}
