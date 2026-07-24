"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";

interface ImpersonateButtonProps {
  tenantId: string;
  tenantName: string;
}

export function ImpersonateButton({ tenantId, tenantName }: ImpersonateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { update } = useSession();
  const router = useRouter();

  const handleImpersonate = async () => {
    try {
      setIsLoading(true);
      
      // 1. Hit the server to log the impersonation event and check permissions
      const res = await fetch(`/api/platform/tenants/${tenantId}/impersonate`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to authorize impersonation");
      }

      // 2. Trigger NextAuth session update to inject the tenantId
      await update({ impersonateAgencyId: tenantId });

      toast.success(`Impersonating ${tenantName}`);
      
      // 3. Redirect to the tenant dashboard
      router.push("/dashboard");
      router.refresh();
      
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleImpersonate}
      disabled={isLoading}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3"
      title={`Impersonate ${tenantName}`}
    >
      <UserCheck className="mr-2 h-4 w-4" />
      {isLoading ? "Authenticating..." : "Impersonate"}
    </button>
  );
}
