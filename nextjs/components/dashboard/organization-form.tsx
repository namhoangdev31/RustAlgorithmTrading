"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { FormInputField } from "@/components/ui/tanstack-form"
import { updateOrganizationAction, deleteOrganizationAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface OrganizationFormProps {
  organization: {
    id: string
    name: string
    type: string
  }
  canDelete: boolean
}

export function OrganizationForm({ organization, canDelete }: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDeleting, startDeleteTransition] = React.useTransition()
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

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("organizationId", organization.id)
        formData.append("returnTo", "/dashboard/settings/account")

        await deleteOrganizationAction(formData)
        toast.success(t("account.org_form.delete_org_success_msg"))
      } catch (error) {
        toast.error(t("account.org_form.delete_org_error_msg"))
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
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
        <Button className="w-fit" type="submit" disabled={isSubmitting || isDeleting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("account.org_form.save_org_btn")}
        </Button>
      </form>

      {canDelete && (
        <div className="border-t border-destructive/20 pt-6">
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <h4 className="text-sm font-semibold text-destructive">
              {t("account.org_form.delete_org_title")}
            </h4>
            <p className="text-xs text-muted-foreground">
              {t("account.org_form.delete_org_desc")}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-fit mt-2" disabled={isSubmitting || isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {t("account.org_form.delete_org_btn")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("account.org_form.delete_org_title")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("account.org_form.delete_org_desc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("account.org_form.cancel_btn") || "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {t("account.org_form.delete_org_btn")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  )
}

