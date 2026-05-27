"use client";

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SocialLoginButtons } from "@/components/layout/social-login-buttons"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"

export default function Signup({
    action,
    socialLoginAction,
    showApple = false,
    error,
}: {
    action: (formData: FormData) => Promise<void>;
    socialLoginAction: (formData: FormData) => Promise<void>;
    showApple?: boolean;
    error?: string;
}) {
    const t = useTranslations("Register");

    return (
        <Card className="w-full max-w-sm m-4 py-0 pt-4">
            <CardHeader>
                <CardTitle className="text-center mt-2">{t("title")}</CardTitle>
                <CardDescription className="text-center mt-2">
                    {t("description")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action}>
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-4 text-left">
                            <label htmlFor="name" className="text-sm font-medium">{t("name")}</label>
                            <Input id="name" name="name" type="text" placeholder={t("name_placeholder")} required />
                        </div>
                        <div className="grid gap-2 text-left">
                            <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
                            <Input id="email" name="email" type="email" placeholder={t("email_placeholder")} required />
                        </div>
                        <div className="grid gap-2 text-left">
                            <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive" role="alert">{error}</p>
                        )}
                    </div>
                    <Button type="submit" className="mt-6 w-full h-11">
                        {t("create_account")}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-4 pb-4">
                <div className="w-full flex items-center gap-2">
                    <div className="flex-grow h-px bg-gray-300"></div>
                    <span className="text-gray-400 text-xs font-medium px-2">{t("quick_sign_up")}</span>
                    <div className="flex-grow h-px bg-gray-300"></div>
                </div>
                <SocialLoginButtons action={socialLoginAction} showApple={showApple} />
                <Button asChild variant="outline" className="w-full h-10">
                    <Link href="/login">{t("back")}</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

