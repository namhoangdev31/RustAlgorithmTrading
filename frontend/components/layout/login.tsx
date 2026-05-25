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
import Link from "next/link"

interface CardLoginProps {
    loginAction: (formData: FormData) => Promise<void>;
    socialLoginAction: (idToken: string) => Promise<void>;
    resetAction: (formData: FormData) => Promise<void>;
    error?: string;
    info?: string;
}

export function CardLogin({ loginAction, socialLoginAction, resetAction, error, info }: CardLoginProps) {
    return (
        <Card className="w-full max-w-sm m-4 py-0 pt-4">
            <CardHeader>
                <CardTitle className="text-center mt-2">Let's Get You In</CardTitle>
                <CardDescription className="text-center mt-2">
                    Enter your credentials to access your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={loginAction}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2 text-left">
                            <label htmlFor="email" className="text-sm font-medium text-black">Email</label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="lowishxx@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-sm font-medium text-black">Password</label>
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
                    <Button type="submit" className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white h-11">
                        Sign in
                    </Button>
                </form>
            </CardContent>

            <CardFooter className="flex-col gap-4 pb-4">
                <div className="w-full flex items-center gap-2">
                    <div className="flex-grow h-px bg-gray-300"></div>
                    <span className="text-gray-400 text-xs font-medium px-2">QUICK LOGIN</span>
                    <div className="flex-grow h-px bg-gray-300"></div>
                </div>

                <SocialLoginButtons action={socialLoginAction} />

                <div className="w-full flex items-center gap-2">
                    <div className="flex-grow h-px bg-gray-300"></div>
                    <span className="text-gray-400 text-xs font-medium px-2">ACCOUNT HELP</span>
                    <div className="flex-grow h-px bg-gray-300"></div>
                </div>

                <form action={resetAction} className="grid w-full gap-2">
                    <Input name="resetEmail" type="email" placeholder="email@example.com" required />
                    <Button variant="outline" className="w-full bg-white text-slate-900 border-gray-300" type="submit">
                        Send reset email
                    </Button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link
                        href="/register"
                        className="text-gray-600 underline-offset-4 hover:underline font-medium"
                    >
                        Sign up
                    </Link>
                </p>
            </CardFooter>
        </Card>
    )
}
