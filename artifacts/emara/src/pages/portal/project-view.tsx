import { useParams, Link } from "wouter";
import {
  useGetProject,
  useListProjectStages,
  useListProjectFiles,
  useListProjectComments,
  useListProjectApprovals,
  useListProjectPayments,
  useGetProjectQuotation,
  useRespondToApproval,
  useCreateProjectComment,
  getListProjectApprovalsQueryKey,
  getListProjectCommentsQueryKey,
} from "@workspace/api-client-react";
import ClientLayout from "@/components/layout/ClientLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  FileText,
  Wallet,
  Sparkles,
} from "lucide-react";
import {
  formatEGP,
  formatDate,
  formatRelativeTime,
  projectStatusLabels,
  stageStatusLabels,
  fileCategoryLabels,
  paymentStatusLabels,
} from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

function ApprovalActions({
  approvalId,
  projectId,
}: {
  approvalId: number;
  projectId: number;
}) {
  const respond = useRespondToApproval();
  const [openType, setOpenType] = useState<"approved" | "revision_required" | "rejected" | null>(null);
  const [comment, setComment] = useState("");

  const submit = () => {
    if (!openType) return;
    respond.mutate(
      {
        id: approvalId,
        data: { status: openType, clientComment: comment || null },
      },
      {
        onSuccess: () => {
          toast.success("تم إرسال ردك");
          queryClient.invalidateQueries({
            queryKey: getListProjectApprovalsQueryKey(projectId),
          });
          setOpenType(null);
          setComment("");
        },
        onError: () => toast.error("فشل الإرسال"),
      },
    );
  };

  const labels: Record<string, string> = {
    approved: "اعتماد",
    revision_required: "طلب تعديلات",
    rejected: "رفض",
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setOpenType("approved")} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> اعتماد
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOpenType("revision_required")}
          className="gap-2"
        >
          <MessageSquare className="h-4 w-4" /> طلب تعديل
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setOpenType("rejected")}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" /> رفض
        </Button>
      </div>
      <Dialog open={!!openType} onOpenChange={(o) => !o && setOpenType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openType ? labels[openType] : ""}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="ملاحظاتك (اختياري)..."
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button onClick={submit} disabled={respond.isPending}>
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PortalProjectViewPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);

  const { data: project, isLoading } = useGetProject(projectId);
  const { data: stages } = useListProjectStages(projectId);
  const { data: files } = useListProjectFiles(projectId);
  const { data: approvals } = useListProjectApprovals(projectId);
  const { data: payments } = useListProjectPayments(projectId);
  const { data: comments } = useListProjectComments(projectId);
  const { data: quotation } = useGetProjectQuotation(projectId);
  const createComment = useCreateProjectComment();

  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    createComment.mutate(
      {
        projectId,
        data: {
          commentText: newComment,
          isInternal: false,
          stageId: null,
          approvalId: null,
        },
      },
      {
        onSuccess: () => {
          toast.success("تم إضافة التعليق");
          queryClient.invalidateQueries({
            queryKey: getListProjectCommentsQueryKey(projectId),
          });
          setNewComment("");
        },
        onError: () => toast.error("فشل إضافة التعليق"),
      },
    );
  };

  if (isLoading || !project) {
    return (
      <ClientLayout>
        <div className="text-center py-20 text-muted-foreground">
          جارٍ التحميل...
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        <div>
          <Link href="/portal">
            <a className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> العودة لمشاريعي
            </a>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">
            {project.projectName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              {projectStatusLabels[project.status] ?? project.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {project.areaSqm} م² • {project.location ?? ""}
            </span>
          </div>
        </div>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">تقدم المشروع</p>
                <p className="text-3xl font-bold mt-1">{project.progressPercent}%</p>
              </div>
              <Sparkles className="h-12 w-12 text-primary/40" />
            </div>
            <Progress value={project.progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              تم إنجاز {project.stagesCompleted} من {project.stagesTotal} مرحلة
            </p>
          </CardContent>
        </Card>

        {approvals && approvals.filter((a) => a.status === "pending").length > 0 && (
          <Card className="border-amber-300 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="text-base text-amber-900 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                موافقات بانتظار ردك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvals
                .filter((a) => a.status === "pending")
                .map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="font-semibold">{a.stageName}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          من {a.requestedByName} • {formatRelativeTime(a.requestedAt)}
                        </p>
                      </div>
                      <ApprovalActions approvalId={a.id} projectId={projectId} />
                    </CardContent>
                  </Card>
                ))}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="stages">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="stages">المراحل</TabsTrigger>
            <TabsTrigger value="files">الملفات</TabsTrigger>
            <TabsTrigger value="quotation">عرض السعر</TabsTrigger>
            <TabsTrigger value="payments">الدفعات</TabsTrigger>
            <TabsTrigger value="comments">المحادثة</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="mt-4 space-y-3">
            {stages?.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <span className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {s.order}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{s.stageName}</p>
                    {s.dueDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        التاريخ المتوقع: {formatDate(s.dueDate)}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      s.status === "approved" || s.status === "completed"
                        ? "default"
                        : s.status === "in_progress" || s.status === "waiting_client_approval"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {stageStatusLabels[s.status] ?? s.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {files?.map((f) => (
                <Card key={f.id} className="overflow-hidden">
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer">
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      {/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(f.fileUrl) ? (
                        <img src={f.fileUrl} alt={f.fileName} className="object-cover w-full h-full" />
                      ) : (
                        <FileText className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">{f.fileName}</p>
                      <Badge variant="outline" className="text-[10px] mt-2">
                        {fileCategoryLabels[f.category] ?? f.category}
                      </Badge>
                    </CardContent>
                  </a>
                </Card>
              ))}
              {(!files || files.length === 0) && (
                <Card className="col-span-full border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    لا توجد ملفات منشورة بعد
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quotation" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>عرض السعر</CardTitle>
                {quotation && (
                  <CardDescription>
                    الحالة:{" "}
                    {quotation.status === "draft"
                      ? "مسودة"
                      : quotation.status === "sent"
                        ? "بانتظار ردك"
                        : quotation.status === "approved"
                          ? "مُعتمد"
                          : "مرفوض"}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {quotation ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span>المساحة × سعر المتر</span>
                      <span>
                        {quotation.areaSqm} × {formatEGP(quotation.pricePerSqm)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span>إجمالي التصميم</span>
                      <span className="font-semibold">{formatEGP(quotation.designSubtotal)}</span>
                    </div>
                    {quotation.shopDrawingPrice > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <span>الرسومات التنفيذية</span>
                        <span>{formatEGP(quotation.shopDrawingPrice)}</span>
                      </div>
                    )}
                    {quotation.supervisionPrice > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <span>الإشراف</span>
                        <span>{formatEGP(quotation.supervisionPrice)}</span>
                      </div>
                    )}
                    {quotation.discount > 0 && (
                      <div className="flex justify-between border-b pb-2 text-rose-600">
                        <span>الخصم</span>
                        <span>- {formatEGP(quotation.discount)}</span>
                      </div>
                    )}
                    {quotation.tax > 0 && (
                      <div className="flex justify-between border-b pb-2">
                        <span>الضريبة</span>
                        <span>{formatEGP(quotation.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2">
                      <span>الإجمالي</span>
                      <span className="text-emerald-600">{formatEGP(quotation.finalTotal)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    لم يتم إصدار عرض سعر بعد
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوصف</TableHead>
                      <TableHead>القيمة</TableHead>
                      <TableHead>الاستحقاق</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell>{formatEGP(p.amount)}</TableCell>
                        <TableCell className="text-xs">{formatDate(p.dueDate)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "paid"
                                ? "default"
                                : p.status === "overdue"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {paymentStatusLabels[p.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!payments || payments.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          <Wallet className="h-10 w-10 mx-auto mb-2" />
                          لا توجد دفعات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Textarea
                  placeholder="اكتب رسالتك للفريق..."
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={createComment.isPending || !newComment.trim()}
                    size="sm"
                  >
                    إرسال
                  </Button>
                </div>
              </CardContent>
            </Card>
            {comments?.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{c.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.commentText}</p>
                </CardContent>
              </Card>
            ))}
            {(!comments || comments.length === 0) && (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center text-muted-foreground text-sm">
                  لا توجد رسائل بعد
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  );
}
