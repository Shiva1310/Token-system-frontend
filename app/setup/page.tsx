"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Phone, Lock } from "lucide-react";

export default function SetupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [closed, setClosed] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(name, phone, password);
      toast.success("Admin account created");
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setClosed(true);
      } else {
        const message =
          err instanceof ApiError ? err.message : "Unable to create account. Please try again.";
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-8 bg-muted/40 px-4 py-12">
      <Logo size="lg" />

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create the first admin account</CardTitle>
          <CardDescription>
            This one-time setup only works before any account exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {closed ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                An admin account already exists, so this setup page is locked.
              </p>
              <Button onClick={() => router.replace("/login")}>Go to login</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    pattern="[0-9]{10}"
                    title="10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <Button type="submit" className="mt-1 w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create admin account"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
