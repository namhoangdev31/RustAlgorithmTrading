"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { FormInputField, FormTextareaField } from "@/components/ui/tanstack-form"
import { updateProfileAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const profileFormSchema = z.object({
  fullName: z.string().min(2, "Username/Full name must be at least 2 characters.").max(50, "Username/Full name must be at most 50 characters."),
  bio: z.string().max(160, "Bio must be at most 160 characters.").optional(),
  urlPrimary: z.string().url("Please enter a valid URL.").or(z.literal("")).optional(),
  urlSecondary: z.string().url("Please enter a valid URL.").or(z.literal("")).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

interface ProfileFormProps {
  user: any;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
        toast.success("Profile updated successfully")
      } catch (error) {
        toast.error("Failed to update profile")
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
            label="Username"
            placeholder="Username"
            description="This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days."
          />
        )}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Email</span>
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
          You can manage verified email addresses in your email settings.
        </span>
      </div>

      <form.Field
        name="bio"
        children={(field) => (
          <FormTextareaField
            field={field}
            label="Bio"
            className="resize-none"
            placeholder="Tell us a little bit about yourself"
            description="You can @mention other users and organizations to link to them."
          />
        )}
      />

      <div className="flex flex-col gap-2">
        <form.Field
          name="urlPrimary"
          children={(field) => (
            <FormInputField
              field={field}
              label="URLs"
              placeholder="https://example.com"
              description="Add links to your website, blog, or social media profiles."
            />
          )}
        />
        
        <form.Field
          name="urlSecondary"
          children={(field) => (
            <FormInputField
              field={field}
              placeholder="http://twitter.com/example"
            />
          )}
        />
      </div>

      <Button className="w-fit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Update profile
      </Button>
    </form>
  )
}
