"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthRecoveryPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setStatus("Redirecting to reset password...");
        router.replace("/reset-password");
      }
    });

    // Fallback: check session after delay
    const timeout = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace("/reset-password");
      } else {
        setStatus("Session expired. Please request a new reset link.");
      }
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}
