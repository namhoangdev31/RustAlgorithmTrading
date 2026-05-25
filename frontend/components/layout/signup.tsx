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
import React, { useState, useRef, useEffect, useCallback } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "@/firebase/firebase"
import { useReCaptcha } from "next-recaptcha-v3"
import { RefreshCw } from "lucide-react"

export default function Signup({ onBack }: { onBack?: () => void }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [captchaCode, setCaptchaCode] = useState("")
    const [captchaInput, setCaptchaInput] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { executeRecaptcha } = useReCaptcha()

    const generateCaptcha = useCallback(() => {
        const chars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
        let code = ""
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setCaptchaCode(code)

        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext("2d")
            if (ctx) {
                // Background
                ctx.fillStyle = "#f1f5f9"
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                // Noise lines
                for (let i = 0; i < 4; i++) {
                    ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.4)`
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
                    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
                    ctx.stroke()
                }

                // Noise dots
                for (let i = 0; i < 30; i++) {
                    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, ${Math.floor(Math.random() * 150)}, 0.3)`
                    ctx.beginPath()
                    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI)
                    ctx.fill()
                }

                // Text
                ctx.font = "bold 20px monospace"
                for (let i = 0; i < code.length; i++) {
                    const char = code[i]
                    ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`

                    ctx.save()
                    const x = 12 + i * 16 + Math.random() * 4
                    const y = 25 + Math.random() * 4
                    const angle = (Math.random() * 30 - 15) * Math.PI / 180

                    ctx.translate(x, y)
                    ctx.rotate(angle)
                    ctx.fillText(char, 0, 0)
                    ctx.restore()
                }
            }
        }
    }, [])

    useEffect(() => {
        generateCaptcha()
    }, [generateCaptcha])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)

        if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
            setError("Incorrect Captcha code. Please try again.")
            setCaptchaInput("")
            generateCaptcha()
            setIsSubmitting(false)
            return
        }

        try {
            if (!executeRecaptcha) {
                throw new Error("reCAPTCHA script has not loaded yet. Please try again.")
            }
            const token = await executeRecaptcha("signup")
            const verifyRes = await fetch("/api/verify-recaptcha", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, action: "signup" }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyData.success) {
                throw new Error(verifyData.error || "reCAPTCHA verification failed")
            }

            const cred = await createUserWithEmailAndPassword(auth, email, password)
            if (cred?.user) {
                await updateProfile(cred.user, { displayName: name })
            }
            onBack && onBack()
        } catch (err: any) {
            setError(err?.message || "Signup failed")
            generateCaptcha()
        } finally {
            setIsSubmitting(false)
        }
    }
    return (
        <Card className="w-full max-w-sm m-4 py-0 pt-4">
            <CardHeader>
                <CardTitle className="text-center mt-2">Create an account</CardTitle>
                <CardDescription className="text-center mt-2">
                    Enter your details to sign up
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-4">
                        <div className="grid gap-4 text-left">
                            <Label htmlFor="name" className="text-black">Name</Label>
                            <Input id="name" type="text" placeholder="Prince Tan" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="grid gap-2 text-left">
                            <Label htmlFor="email" className="text-black">Email</Label>
                            <Input id="email" type="email" placeholder="lowishxx@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="grid gap-2 text-left">
                            <Label htmlFor="password" className="text-black">Password</Label>
                            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <div className="grid gap-2 text-left">
                            <Label htmlFor="captchaInput" className="text-black">Captcha Verification</Label>
                            <div className="flex gap-2 items-center">
                                <canvas
                                    ref={canvasRef}
                                    width={120}
                                    height={40}
                                    className="border rounded bg-slate-50 cursor-pointer shrink-0"
                                    title="Click to refresh Captcha"
                                    onClick={generateCaptcha}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 border-gray-300"
                                    onClick={generateCaptcha}
                                    title="Refresh Captcha"
                                >
                                    <RefreshCw className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                            <Input
                                id="captchaInput"
                                type="text"
                                placeholder="Enter code shown above"
                                required
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-destructive" role="alert">{error}</p>
                        )}
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2 pb-4">
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? "Creating..." : "Create account"}
                </Button>
                <Button variant="outline" className="w-full bg-white text-slate-900 border-gray-300 h-10" onClick={onBack}>Back</Button>
            </CardFooter>
        </Card>
    )
}