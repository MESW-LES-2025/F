"use client";

import type React from "react";

import { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { updateUser } = useAuth();

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [message, setMessage] = useState("Verifying your email...");
  const verifyCalled = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing verification token.");
      return;
    }

    if (verifyCalled.current) return;
    verifyCalled.current = true;

    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus("success");
        setMessage(
          "Email verified successfully! You can now access your account.",
        );
        updateUser(response.user);

        // Redirect to dashboard after a delay
        setTimeout(() => {
          const houses = response.user.houses || [];
          if (!houses.length) {
            router.push("/join-house");
          } else if (houses.length && houses.length > 1) {
            router.push("/choose-house");
          } else {
            router.push(`/?houseId=${houses[0].id}`);
          }
        }, 3000);
      } catch (err) {
        setStatus("error");
        setMessage(
          err instanceof Error
            ? err.message
            : "Failed to verify email. Please try again.",
        );
      }
    };

    verify();
  }, [token, router, updateUser]);

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        {status === "verifying" && (
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
        )}
        {status === "success" && (
          <CheckCircle className="w-16 h-16 text-green-500" />
        )}
        {status === "error" && <XCircle className="w-16 h-16 text-red-500" />}
      </div>

      <h2 className="text-2xl font-bold mb-4">
        {status === "verifying" && "Verifying Email"}
        {status === "success" && "Email Verified!"}
        {status === "error" && "Verification Failed"}
      </h2>

      <p className="text-muted-foreground mb-8">{message}</p>

      {status === "error" && (
        <Button
          asChild
          className="w-full h-11 text-base font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
        >
          <Link href="/login">Back to Login</Link>
        </Button>
      )}

      {status === "success" && (
        <p className="text-sm text-muted-foreground">
          Redirecting you to the app...
        </p>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Image
              src="/concordia-logo.png"
              alt="Concordia Logo"
              width={80}
              height={80}
              className="rounded-2xl shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Concordia</h1>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
