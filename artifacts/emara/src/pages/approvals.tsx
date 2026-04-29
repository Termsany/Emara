import {
  useGetPendingApprovals,
  useRespondToApproval,
  getGetPendingApprovalsQueryKey,
} from "@workspace/api-client-react";
import InternalLayout from "@/components/layout/InternalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, Clock } from "lucide-react";
import { formatRelativeTime, approvalStatusLabels } from "@/lib/format";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

function RespondDialog({
  approvalId,
  trigger,
  status,
  label,
  variant,
}: {
  approvalId: number;
  trigger: React.ReactNode;
  status: "approved" | "approved_with_comments" | "revision_required" | "rejected";
  label: string;
  variant: "default" | "destructive" | "outline" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const respond = useRespondToApproval();

  const handleSubmit = () => {
    respond.mutate(
      {
        id: approvalId,
        data: { status, clientComment: comment || null },
      },
      {
        onSuccess: () => {
          toast.success(label);
          queryClient.invalidateQueries({ queryKey: getGetPendingApprovalsQueryKey() });
          setOpen(false);
        },
        onError: () => toast.error("فشل الإجراء"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="ملاحظات (اختياري)..."
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <DialogFooter>
          <Button variant={variant} onClick={handleSubmit} disabled={respond.isPending}>
            {respond.isPending ? "جارٍ الإرسال..." : "تأكيد"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ApprovalsPage() {
  const { data: approvals, isLoading } = useGetPendingApprovals();

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الموافقات</h1>
          <p className="text-muted-foreground">
            جميع طلبات الموافقة المعلقة من العملاء أو الفريق.
          </p>
        </div>

        {isLoading && <div className="text-center py-10">جارٍ التحميل...</div>}

        <div className="grid gap-4">
          {approvals?.map((a) => (
            <Card key={a.id} className="border-card-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {approvalStatusLabels[a.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        طُلبت {formatRelativeTime(a.requestedAt)}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{a.stageName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {a.projectName} — {a.clientName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      مطلوب من: {a.requestedByName}
                    </p>
                    {a.internalComment && (
                      <div className="mt-3 p-3 bg-muted/40 rounded-md">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          ملاحظات داخلية:
                        </p>
                        <p className="text-sm">{a.internalComment}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <RespondDialog
                      approvalId={a.id}
                      status="approved"
                      label="اعتماد"
                      variant="default"
                      trigger={
                        <Button variant="default" size="sm" className="gap-2">
                          <CheckCircle2 className="h-4 w-4" /> اعتماد
                        </Button>
                      }
                    />
                    <RespondDialog
                      approvalId={a.id}
                      status="revision_required"
                      label="طلب مراجعة"
                      variant="secondary"
                      trigger={
                        <Button variant="secondary" size="sm" className="gap-2">
                          <MessageSquare className="h-4 w-4" /> طلب مراجعة
                        </Button>
                      }
                    />
                    <RespondDialog
                      approvalId={a.id}
                      status="rejected"
                      label="رفض"
                      variant="destructive"
                      trigger={
                        <Button variant="destructive" size="sm" className="gap-2">
                          <XCircle className="h-4 w-4" /> رفض
                        </Button>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!isLoading && approvals?.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-16 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  لا توجد موافقات معلقة في الوقت الحالي
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </InternalLayout>
  );
}
