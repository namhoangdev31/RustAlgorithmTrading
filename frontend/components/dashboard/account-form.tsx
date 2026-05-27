"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { FormInputField, FormSelectField } from "@/components/ui/tanstack-form"
import { updateProfileAction } from "@/app/actions/admin"
import { toast } from "sonner"
import { Loader2, Mail, Shield, User as UserIcon } from "lucide-react"
import Image from "next/image"

// Simple SVG Google and GitHub icons for premium UI badges
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

interface AccountFormProps {
  user: any
}

export function AccountForm({ user }: AccountFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const t = useTranslations("Settings")

  const accountFormSchema = React.useMemo(() => {
    return z.object({
      firstName: z.string().min(2, t("account.validation.first_name_min")).optional().or(z.literal("")),
      lastName: z.string().min(2, t("account.validation.last_name_min")).optional().or(z.literal("")),
      fullName: z.string().min(2, t("account.validation.full_name_min")),
      phone: z.string().optional().or(z.literal("")),
      gender: z.string().optional().or(z.literal("")),
    })
  }, [t])

  type AccountFormValues = z.infer<typeof accountFormSchema>

  if (!user) {
    return null
  }

  const form = useForm({
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      fullName: user.fullName ?? "",
      phone: user.phone ?? "",
      gender: user.gender ?? "",
    } as AccountFormValues,
    validators: {
      onSubmit: accountFormSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append("firstName", value.firstName || "")
        formData.append("lastName", value.lastName || "")
        formData.append("fullName", value.fullName || "")
        formData.append("phone", value.phone || "")
        formData.append("gender", value.gender || "")
        formData.append("returnTo", "/dashboard/settings/account")

        await updateProfileAction(formData)
        toast.success(t("account.success_msg"))
      } catch (error) {
        toast.error(t("account.error_msg"))
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  // Provider styles & rendering helpers
  const providerType = user.provider?.toLowerCase() || "email"

  let providerBadge = (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground shadow-sm">
      <Mail className="h-3 w-3" />
      <span>Email</span>
    </div>
  )

  let avatarBadge = (
    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-border shadow-sm">
      <Mail className="h-3 w-3 text-muted-foreground" />
    </div>
  )

  if (providerType === "google") {
    providerBadge = (
      <div className="flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-2.5 py-0.5 text-xs font-semibold text-blue-500 shadow-sm">
        <GoogleIcon className="h-3 w-3" />
        <span>Google</span>
      </div>
    )
    avatarBadge = (
      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-border shadow-md">
        <GoogleIcon className="h-3.5 w-3.5" />
      </div>
    )
  } else if (providerType === "github") {
    providerBadge = (
      <div className="flex items-center gap-1.5 rounded-full border border-foreground/20 bg-foreground/5 px-2.5 py-0.5 text-xs font-semibold text-foreground shadow-sm dark:bg-white/10 dark:text-white dark:border-white/10">
        <GithubIcon className="h-3 w-3" />
        <span>GitHub</span>
      </div>
    )
    avatarBadge = (
      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black border border-zinc-800 shadow-md text-white dark:bg-zinc-900 dark:border-zinc-800">
        <GithubIcon className="h-3.5 w-3.5" />
      </div>
    )
  }

  const avatarUrl = user.photo?.path
  const initials = (user.fullName || user.email || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex flex-col gap-8">
      {/* Visual Identity Section */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="relative h-20 w-20 flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={user.fullName || "User Avatar"}
              width={100}
              height={100}
              className="h-full w-full rounded-full object-cover border-2 border-primary/20 shadow-inner transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-xl font-bold text-emerald-500 border-2 border-emerald-500/20 shadow-inner transition-transform duration-300 hover:scale-105">
              {initials}
            </div>
          )}
          {avatarBadge}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold leading-none">{user.fullName || user.email}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("account.provider_info", { provider: "" }).replace(" {provider}", "")}
            </span>
            {providerBadge}
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="flex flex-col gap-6"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <form.Field
            name="firstName"
            children={(field) => (
              <FormInputField
                field={field}
                label={t("account.first_name_label")}
                placeholder={t("account.first_name_placeholder")}
              />
            )}
          />

          <form.Field
            name="lastName"
            children={(field) => (
              <FormInputField
                field={field}
                label={t("account.last_name_label")}
                placeholder={t("account.last_name_placeholder")}
              />
            )}
          />
        </div>

        <form.Field
          name="fullName"
          children={(field) => (
            <FormInputField
              field={field}
              label={t("account.full_name_label")}
              placeholder={t("account.full_name_placeholder")}
            />
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <form.Field
            name="phone"
            children={(field) => (
              <FormInputField
                field={field}
                label={t("account.phone_label")}
                placeholder={t("account.phone_placeholder")}
              />
            )}
          />

          <form.Field
            name="gender"
            children={(field) => (
              <FormSelectField
                field={field}
                label={t("account.gender_label")}
                placeholder={t("account.gender_placeholder")}
                options={[
                  { label: t("account.gender_male"), value: "male" },
                  { label: t("account.gender_female"), value: "female" },
                  { label: t("account.gender_other"), value: "other" },
                  { label: t("account.gender_prefer_not_to_say"), value: "prefer_not_to_say" },
                ]}
              />
            )}
          />
        </div>

        <Button className="w-fit transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]" type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("account.save_btn")}
        </Button>
      </form>
    </div>
  )
}
