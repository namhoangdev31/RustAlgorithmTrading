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
    return (
        <Card className="w-full max-w-sm m-4 py-0 pt-4">
            <CardHeader>
                <CardTitle className="text-center mt-2">Create an account</CardTitle>
                <CardDescription className="text-center mt-2">
                    Enter your details to sign up
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action}>
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-4 text-left">
                            <label htmlFor="name" className="text-sm font-medium text-black">Name</label>
                            <Input id="name" name="name" type="text" placeholder="Prince Tan" required />
                        </div>
                        <div className="grid gap-2 text-left">
                            <label htmlFor="email" className="text-sm font-medium text-black">Email</label>
                            <Input id="email" name="email" type="email" placeholder="lowishxx@example.com" required />
                        </div>
                        <div className="grid gap-2 text-left">
                            <label htmlFor="password" className="text-sm font-medium text-black">Password</label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive" role="alert">{error}</p>
                        )}
                    </div>
                    <Button type="submit" className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white h-11">
                        Create account
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-4 pb-4">
                <div className="w-full flex items-center gap-2">
                    <div className="flex-grow h-px bg-gray-300"></div>
                    <span className="text-gray-400 text-xs font-medium px-2">QUICK SIGN UP</span>
                    <div className="flex-grow h-px bg-gray-300"></div>
                </div>
                <SocialLoginButtons action={socialLoginAction} showApple={showApple} />
                <Button asChild variant="outline" className="w-full bg-white text-slate-900 border-gray-300 h-10">
                    <Link href="/login">Back</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
