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

export default function ResetPassword({
    action,
    oobCode,
    error,
    info,
}: {
    action: (formData: FormData) => Promise<void>;
    oobCode: string;
    error?: string;
    info?: string;
}) {

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Reset password</CardTitle>
                <CardDescription>
                    Enter a new password for your Firebase account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={action}>
                    <input type="hidden" name="oobCode" value={oobCode} />
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-sm font-medium">New password</label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="confirm" className="text-sm font-medium">Confirm password</label>
                            <Input id="confirm" name="confirm" type="password" required />
                        </div>
                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3">
                                <p className="text-sm text-destructive" role="alert">{error}</p>
                            </div>
                        )}
                        {info && (
                            <div className="rounded-md bg-green-50 p-3">
                                <p className="text-sm text-green-600" role="status">{info}</p>
                            </div>
                        )}
                    </div>
                    <Button className="mt-6 w-full" type="submit">
                        Update password
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button asChild variant="outline" className="w-full">
                    <a href="/login">Back to Login</a>
                </Button>
            </CardFooter>
        </Card>
    )
}
