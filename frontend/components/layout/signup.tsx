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
import React, { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth } from "@/firebase/firebase"

export default function Signup({ onBack }: { onBack?: () => void }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsSubmitting(true)
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password)
            if (cred?.user) {
                await updateProfile(cred.user, { displayName: name })
            }
            onBack && onBack()
        } catch (err: any) {
            setError(err?.message || "Signup failed")
        } finally {
            setIsSubmitting(false)
        }
    }
    return (
        <Card className="w-full max-w-sm m-4">
            <CardHeader>
                <CardTitle className="text-center mt-2">Create an account</CardTitle>
                <CardDescription className="text-center mt-2 m-12">
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
                        {error && (
                            <p className="text-sm text-destructive" role="alert">{error}</p>
                        )}
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11" disabled={isSubmitting} onClick={handleSubmit}>
                    {isSubmitting ? "Creating..." : "Create account"}
                </Button>
                <Button variant="outline" className="w-full bg-white text-slate-900 border-gray-300 h-10" onClick={onBack}>Back</Button>
            </CardFooter>
        </Card>
    )
}