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
import { Label } from "@/components/ui/label"
import React, { useEffect, useMemo, useState } from "react"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { auth } from "@/firebase/firebase"

export default function ResetPassword({ onDone }: { onDone?: () => void }) {
    const params = useMemo(() => new URLSearchParams(window.location.search), [])
    // Try to get oobCode from query params first, then from hash
    const oobCodeFromQuery = params.get("oobCode") || ""
    const hashParams = useMemo(() => {
        const hash = window.location.hash.substring(1)
        return new URLSearchParams(hash)
    }, [])
    const oobCodeFromHash = hashParams.get("oobCode") || ""
    const oobCode = oobCodeFromQuery || oobCodeFromHash
    const initialEmail = params.get("email") || ""
    const [email, setEmail] = useState(initialEmail)
    const [password, setPassword] = useState("")
    const [confirm, setConfirm] = useState("")
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(true)
    const [error, setError] = useState("")
    const [info, setInfo] = useState("")

    useEffect(() => {
        let active = true
        async function checkCode() {
            setError("")
            setInfo("")
            setVerifying(true)

            if (!oobCode) {
                if (active) {
                    setError("Invalid or missing reset code. Please request a new password reset email.")
                    setVerifying(false)
                }
                return
            }

            try {
                const mail = await verifyPasswordResetCode(auth, oobCode)
                if (active && mail) {
                    setEmail(mail)
                    setVerifying(false)
                }
            } catch (err: any) {
                if (active) {
                    let errorMessage = "Reset link is invalid or expired."
                    if (err.code === "auth/invalid-action-code") {
                        errorMessage = "This reset link is invalid or has expired. Please request a new password reset email."
                    } else if (err.code === "auth/expired-action-code") {
                        errorMessage = "This reset link has expired. Please request a new password reset email."
                    } else {
                        errorMessage = err.message || "Reset link is invalid or expired."
                    }
                    setError(errorMessage)
                    setVerifying(false)
                }
            }
        }
        checkCode()
        return () => { active = false }
    }, [oobCode])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setInfo("")

        if (!oobCode) {
            setError("Reset code is missing. Please request a new password reset email.")
            return
        }

        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters.")
            return
        }
        if (password !== confirm) {
            setError("Passwords do not match.")
            return
        }
        try {
            setLoading(true)
            await confirmPasswordReset(auth, oobCode, password)
            setInfo("Password updated successfully! Redirecting to login...")
            setTimeout(() => {
                onDone && onDone()
            }, 2000)
        } catch (err: any) {
            let errorMessage = "Failed to update password."
            if (err.code === "auth/invalid-action-code") {
                errorMessage = "This reset link is invalid or has expired. Please request a new password reset email."
            } else if (err.code === "auth/expired-action-code") {
                errorMessage = "This reset link has expired. Please request a new password reset email."
            } else {
                errorMessage = err.message || "Failed to update password."
            }
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Reset password</CardTitle>
                <CardDescription>
                    {email ? `Resetting password for ${email}` : "Enter a new password"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {verifying ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-sm text-muted-foreground">Verifying reset link...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="password">New password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading || !!error}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm">Confirm password</Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    required
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    disabled={loading || !!error}
                                />
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
                    </form>
                )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
                {!verifying && (
                    <>
                        <Button
                            className="w-full"
                            type="submit"
                            disabled={loading || !!error}
                            onClick={handleSubmit}
                        >
                            {loading ? "Updating..." : "Update password"}
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            type="button"
                            onClick={onDone}
                            disabled={loading}
                        >
                            Back to Login
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    )
}

