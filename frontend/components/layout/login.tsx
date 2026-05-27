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

interface CardLoginProps {
    loginAction: (formData: FormData) => Promise<void>;
    socialLoginAction: (formData: FormData) => Promise<void>;
    resetAction: (formData: FormData) => Promise<void>;
    showApple?: boolean;
    error?: string;
    info?: string;
}

export function CardLogin({
    loginAction,
    socialLoginAction,
    resetAction,
    showApple = false,
    error,
    info,
}: CardLoginProps) {
    const t = useTranslations("Login");

    return (
        <Card className="w-full max-w-sm m-4 py-0 pt-4">
            <CardHeader>
                <CardTitle className="text-center mt-2">{t("title")}</CardTitle>
                <CardDescription className="text-center mt-2">
                    {t("description")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={loginAction}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2 text-left">
                            <label htmlFor="email" className="text-sm font-medium">{t("email")}</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder={t("email_placeholder")}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium">{t("password")}</label>
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive" role="alert">{error}</p>
                        )}
                        {info && (
                            <p className="text-sm text-green-600" role="status">{info}</p>
                        )}
                    </div>
                    <Button type="submit" className="mt-6 w-full h-11">
                        {t("sign_in")}
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="flex-col gap-4 pb-4">
                <div className="w-full flex items-center gap-2">
                    <div className="flex-grow h-px bg-gray-300"></div>
                    <span className="text-gray-400 text-xs font-medium px-2">{t("quick_login")}</span>
                    <div className="flex-grow h-px bg-gray-300"></div>
                </div>

                <SocialLoginButtons action={socialLoginAction} showApple={showApple} />

                <div className="w-full flex items-center gap-2">
                    <div className="flex-grow h-px bg-gray-300"></div>
                    <span className="text-gray-400 text-xs font-medium px-2">{t("account_help")}</span>
                    <div className="flex-grow h-px bg-gray-300"></div>
                </div>

                <form action={resetAction} className="grid w-full gap-2">
                    <Input name="resetEmail" type="email" placeholder={t("reset_email_placeholder")} required />
                    <Button variant="outline" className="w-full" type="submit">
                        {t("send_reset_email")}
                    </Button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    {t("no_account")}{' '}
                    <Link
                        href="/register"
                        className="text-gray-600 underline-offset-4 hover:underline font-medium"
                    >
                        {t("sign_up")}
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}
