"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { FormInputField } from "@/components/ui/tanstack-form"
import { updateOrganizationAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const organizationFormSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters.").max(100, "Organization name must be at most 100 characters."),
})

type OrganizationFormValues = z.infer<typeof organizationFormSchema>

interface OrganizationFormProps {
  organization: {
    id: string
    name: string
    type: string
  }
}

export function OrganizationForm({ organization }: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
        toast.success("Organization updated successfully")
      } catch (error) {
        toast.error("Failed to update organization")
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
            label="Name"
            placeholder="Organization Name"
          />
        )}
      />
      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save organization
      </Button>
    </form>
  )
}
