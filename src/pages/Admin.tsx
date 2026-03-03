import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, XCircle, Loader2, Receipt, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { UpgradeRequestStatus } from "@/components/UpgradeDialog";

interface AdminUpgradeRequest {
  id: string;
  user_id: string;
  requested_tier: string;
  amount: number;
  payment_reference: string | null;
  receipt_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

const Admin = () => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-upgrade-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upgrade_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as AdminUpgradeRequest[];
    },
    enabled: !!isAdmin,
  });

  const handleAction = async (requestId: string, action: "approved" | "rejected") => {
    if (!user) return;
    setProcessingId(requestId);
    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) return;

      // Update the request status
      const { error: updateError } = await supabase
        .from("upgrade_requests")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          admin_note: adminNotes[requestId] || null,
        } as any)
        .eq("id", requestId);

      if (updateError) throw updateError;

      // If approved, update user's subscription tier and storage limit
      if (action === "approved") {
        const storageLimit =
          request.requested_tier === "premium"
            ? 300 * 1024 * 1024
            : 200 * 1024 * 1024;

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: request.requested_tier,
            storage_limit_bytes: storageLimit,
          } as any)
          .eq("id", request.user_id);

        if (profileError) throw profileError;
      }

      toast({ title: `Request ${action}`, description: `The upgrade request has been ${action}.` });
      queryClient.invalidateQueries({ queryKey: ["admin-upgrade-requests"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const getReceiptUrl = (path: string) => {
    const { data } = supabase.storage.from("receipts").getPublicUrl(path);
    return data.publicUrl;
  };

  if (adminLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
        </div>
      </DashboardLayout>
    );
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground mt-1">Review and manage upgrade requests.</p>
        </motion.div>

        {/* Pending Requests */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Pending Requests ({pendingRequests.length})
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending requests.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground">User ID</p>
                        <p className="text-xs font-mono text-foreground">{req.user_id}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="capitalize">{req.requested_tier}</Badge>
                        <p className="text-sm font-semibold text-foreground mt-1">
                          ₦{req.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {req.payment_reference && (
                      <div>
                        <p className="text-sm text-muted-foreground">Reference</p>
                        <p className="text-sm font-mono text-foreground">{req.payment_reference}</p>
                      </div>
                    )}

                    {req.receipt_url && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Receipt</p>
                        <a
                          href={getReceiptUrl(req.receipt_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <Receipt className="w-4 h-4" /> View Receipt <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs">Admin Note (optional)</Label>
                      <Input
                        placeholder="Add a note..."
                        value={adminNotes[req.id] || ""}
                        onChange={(e) =>
                          setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        maxLength={500}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(req.id, "approved")}
                        disabled={processingId === req.id}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingId === req.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(req.id, "rejected")}
                        disabled={processingId === req.id}
                      >
                        <XCircle className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Submitted: {new Date(req.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Processed ({processedRequests.length})
            </h2>
            <div className="space-y-3">
              {processedRequests.map((req) => (
                <Card key={req.id} className="opacity-75">
                  <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-xs font-mono text-muted-foreground">{req.user_id}</p>
                      <Badge variant="secondary" className="capitalize mt-1">{req.requested_tier}</Badge>
                    </div>
                    <div className="text-right">
                      <UpgradeRequestStatus status={req.status} />
                      {req.admin_note && (
                        <p className="text-xs text-muted-foreground mt-1">{req.admin_note}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Admin;
