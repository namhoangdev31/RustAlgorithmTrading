import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { FormInputField } from "@/components/ui/tanstack-form"
import { updateOrganizationAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface OrganizationFormProps {
  organization: {
    id: string
    name: string
    type: string
  }
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const t = useTranslations("Settings")

  const organizationFormSchema = React.useMemo(() => {
    return z.object({
      name: z.string()
        .min(2, t("account.org_form.validation_min"))
        .max(100, t("account.org_form.validation_max")),
    })
  }, [t])

  type OrganizationFormValues = z.infer<typeof organizationFormSchema>

  const form = useForm({
    defaultValues: {
      name: organization.name,
    } as OrganizationFormValues,
    validators: {
      onSubmit: organizationFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append("organizationId", organization.id)
        formData.append("type", organization.type)
        formData.append("name", value.name)
        formData.append("returnTo", "/dashboard/settings/account")

        await updateOrganizationAction(formData)
        toast.success(t("account.org_form.success_msg"))
      } catch (error) {
        toast.error(t("account.org_form.error_msg"))
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
        name="name"
        children={(field) => (
          <FormInputField
            field={field}
            label={t("account.org_form.name_label")}
            placeholder={t("account.org_form.name_placeholder")}
          />
        )}
      />
      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t("account.org_form.save_org_btn")}
      </Button>
    </form>
  )
}

