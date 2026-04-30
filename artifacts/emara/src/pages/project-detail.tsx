import { useParams, Link } from "wouter";
import {
  useGetProject,
  useListProjectStages,
  useListProjectFiles,
  useListProjectComments,
  useListProjectApprovals,
  useListProjectPayments,
  useListProjectBoq,
  useGetProjectQuotation,
  useUpdateStage,
  useRequestApproval,
  useCreateProjectComment,
  getListProjectStagesQueryKey,
  getListProjectApprovalsQueryKey,
  getListProjectCommentsQueryKey,
  getGetProjectQueryKey,
} from "@workspace/api-client-react";
import InternalLayout from "@/components/layout/InternalLayout";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  Wallet,
  ListChecks,
  FolderOpen,
} from "lucide-react";
import {
  formatEGP,
  formatDate,
  formatRelativeTime,
  projectStatusLabels,
  stageStatusLabels,
  projectTypeLabels,
  designStyleLabels,
  scopeTypeLabels,
  fileCategoryLabels,
  paymentStatusLabels,
  boqCategoryLabels,
  boqUnitLabels,
} from "@/lib/format";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";

const stageStatusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  approved: "default",
  completed: "default",
  in_progress: "secondary",
  waiting_client_approval: "secondary",
  revision_required: "destructive",
  not_started: "outline",
  locked: "outline",
};

function StageItem({ stage, projectId }: { stage: any; projectId: number }) {
  const updateStage = useUpdateStage();
  const requestApproval = useRequestApproval();

  const setStatus = (status: string) => {
    updateStage.mutate(
      { id: stage.id, data: { status: status as any } },
      {
        onSuccess: () => {
          toast.success("تم تحديث المرحلة");
          queryClient.invalidateQueries({
            queryKey: getListProjectStagesQueryKey(projectId),
          });
          queryClient.invalidateQueries({
            queryKey: getGetProjectQueryKey(projectId),
          });
        },
        onError: () => toast.error("فشل التحديث"),
      },
    );
  };

  const handleRequestApproval = () => {
    requestApproval.mutate(
      {
        projectId,
        data: { stageId: stage.id, internalComment: null },
      },
      {
        onSuccess: () => {
          toast.success("تم طلب موافقة العميل");
          queryClient.invalidateQueries({
            queryKey: getListProjectApprovalsQueryKey(projectId),
          });
        },
        onError: () => toast.error("فشل طلب الموافقة"),
      },
    );
  };

  return (
    <Card className="border-card-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {stage.order}
              </span>
              <h4 className="font-semibold">{stage.stageName}</h4>
              <Badge variant={stageStatusVariant[stage.status] ?? "outline"}>
                {stageStatusLabels[stage.status] ?? stage.status}
              </Badge>
              {stage.requiresClientApproval && (
                <Badge variant="outline" className="text-[10px]">
                  يتطلب موافقة
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
              {stage.assignedToName && (
                <span>المسؤول: {stage.assignedToName}</span>
              )}
              {stage.dueDate && <span>الاستحقاق: {formatDate(stage.dueDate)}</span>}
              {stage.completedAt && (
                <span>اكتمال: {formatDate(stage.completedAt)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[160px]">
            <Select
              value={stage.status}
              onValueChange={setStatus}
              disabled={updateStage.isPending}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(stageStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {stage.requiresClientApproval && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestApproval}
                disabled={requestApproval.isPending}
              >
                طلب موافقة العميل
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentsTab({ projectId }: { projectId: number }) {
  const { data: comments } = useListProjectComments(projectId);
  const create = useCreateProjectComment();
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    create.mutate(
      {
        projectId,
        data: { commentText: text, isInternal: internal, stageId: null, approvalId: null },
      },
      {
        onSuccess: () => {
          toast.success("تم إضافة التعليق");
          queryClient.invalidateQueries({
            queryKey: getListProjectCommentsQueryKey(projectId),
          });
          setText("");
        },
        onError: () => toast.error("فشل إضافة التعليق"),
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-3">
          <Textarea
            placeholder="اكتب تعليقاً..."
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={internal} onCheckedChange={setInternal} id="internal" />
              <Label htmlFor="internal" className="text-sm">
                ملاحظة داخلية (لا تظهر للعميل)
              </Label>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={create.isPending || !text.trim()}
              size="sm"
            >
              نشر التعليق
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {comments?.map((c) => (
          <Card key={c.id} className={c.isInternal ? "bg-amber-50/30 border-amber-200" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{c.userName}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {c.userRole}
                  </Badge>
                  {c.isInternal && (
                    <Badge variant="secondary" className="text-[10px]">
                      داخلي
                    </Badge>
                  )}
                </div>
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
              <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              لا توجد تعليقات بعد
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);

  const { data: project, isLoading } = useGetProject(projectId);
  const { data: stages } = useListProjectStages(projectId);
  const { data: files } = useListProjectFiles(projectId);
  const { data: approvals } = useListProjectApprovals(projectId);
  const { data: payments } = useListProjectPayments(projectId);
  const { data: boq } = useListProjectBoq(projectId);
  const { data: quotation } = useGetProjectQuotation(projectId);

  if (isLoading || !project) {
    return (
      <InternalLayout>
        <div className="text-center py-20 text-muted-foreground">
          جارٍ التحميل...
        </div>
      </InternalLayout>
    );
  }

  const totalDue =
    payments?.filter((p) => p.status !== "paid" && p.status !== "cancelled")
      .reduce((s, p) => s + p.amount, 0) ?? 0;
  const totalPaid =
    payments?.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0;
  const boqTotal = boq?.reduce((s, i) => s + i.totalPrice, 0) ?? 0;

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/projects">
              <a className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowRight className="h-3 w-3" /> العودة للمشاريع
              </a>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              {project.projectName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{project.clientName}</span>
              <span>•</span>
              <span>{projectTypeLabels[project.projectType] ?? project.projectType}</span>
              <span>•</span>
              <span>{project.areaSqm} م²</span>
            </div>
          </div>
          <Badge className="text-sm py-1 px-3">
            {projectStatusLabels[project.status] ?? project.status}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">التقدم</p>
              <p className="text-2xl font-bold mt-1">{project.progressPercent}%</p>
              <Progress value={project.progressPercent} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">المراحل</p>
              <p className="text-2xl font-bold mt-1">
                {project.stagesCompleted} / {project.stagesTotal}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">المحصل</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">
                {formatEGP(totalPaid)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">المستحق</p>
              <p className="text-2xl font-bold mt-1 text-amber-600">
                {formatEGP(totalDue)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stages" className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full">
            <TabsTrigger value="stages">المراحل</TabsTrigger>
            <TabsTrigger value="info">البيانات</TabsTrigger>
            <TabsTrigger value="quotation">عرض السعر</TabsTrigger>
            <TabsTrigger value="files">الملفات</TabsTrigger>
            <TabsTrigger value="payments">الدفعات</TabsTrigger>
            <TabsTrigger value="boq">جدول الكميات</TabsTrigger>
            <TabsTrigger value="comments">التعليقات</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="space-y-3 mt-4">
            {stages?.map((s) => (
              <StageItem key={s.id} stage={s} projectId={projectId} />
            ))}
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <Card>
              <CardContent className="p-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">الموقع</p>
                  <p className="font-medium mt-1">{project.location ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الميزانية</p>
                  <p className="font-medium mt-1">{formatEGP(project.budget ?? 0)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الطراز</p>
                  <p className="font-medium mt-1">
                    {designStyleLabels[project.designStyle] ?? project.designStyle}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">نطاق العمل</p>
                  <p className="font-medium mt-1">
                    {scopeTypeLabels[project.scopeType] ?? project.scopeType}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">تاريخ البدء</p>
                  <p className="font-medium mt-1">{formatDate(project.startDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">التسليم المتوقع</p>
                  <p className="font-medium mt-1">{formatDate(project.expectedEndDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">ملاحظات</p>
                  <p className="font-medium mt-1 whitespace-pre-wrap">
                    {project.notes ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotation" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>عرض السعر</CardTitle>
                {quotation && (
                  <CardDescription>
                    الحالة: {quotation.status === "draft" ? "مسودة" :
                             quotation.status === "sent" ? "مُرسل" :
                             quotation.status === "approved" ? "مُعتمد" : "مرفوض"}
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
                      <span>الإجمالي النهائي</span>
                      <span className="text-emerald-600">
                        {formatEGP(quotation.finalTotal)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3" />
                    لا يوجد عرض سعر بعد
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {files?.map((f) => (
                <a
                  key={f.id}
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group"
                >
                  <Card className="transition-shadow group-hover:shadow-md group-hover:border-primary/40 h-full">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded mb-3 flex items-center justify-center overflow-hidden">
                        {/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(f.fileUrl) ? (
                          <img
                            src={f.fileUrl}
                            alt={f.fileName}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm font-medium truncate">{f.fileName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-[10px]">
                          {fileCategoryLabels[f.category] ?? f.category}
                        </Badge>
                        <div className="flex items-center gap-2">
                          {!f.isPublic && (
                            <Badge variant="secondary" className="text-[10px]">
                              داخلي
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">v{f.version}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
              {(!files || files.length === 0) && (
                <Card className="col-span-full border-dashed">
                  <CardContent className="p-12 text-center text-muted-foreground">
                    <FolderOpen className="h-10 w-10 mx-auto mb-3" />
                    لا توجد ملفات بعد
                  </CardContent>
                </Card>
              )}
            </div>
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
                          <Wallet className="h-10 w-10 mx-auto mb-3" />
                          لا توجد دفعات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boq" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>جدول الكميات</CardTitle>
                <div className="text-end">
                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                  <p className="text-xl font-bold text-emerald-600">{formatEGP(boqTotal)}</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البند</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الوحدة</TableHead>
                      <TableHead className="text-end">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boq?.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.itemName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{boqCategoryLabels[i.category] ?? i.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {i.quantity} {boqUnitLabels[i.unit] ?? i.unit}
                        </TableCell>
                        <TableCell>{formatEGP(i.unitPrice)}</TableCell>
                        <TableCell className="text-end font-semibold">
                          {formatEGP(i.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!boq || boq.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          <ListChecks className="h-10 w-10 mx-auto mb-3" />
                          لا توجد بنود
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentsTab projectId={projectId} />
          </TabsContent>
        </Tabs>

        {approvals && approvals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                الموافقات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المرحلة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>طُلبت في</TableHead>
                    <TableHead>الرد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.stageName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "approved"
                              ? "default"
                              : a.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {a.status === "pending" ? (
                            <Clock className="h-3 w-3 me-1" />
                          ) : a.status === "approved" ? (
                            <CheckCircle2 className="h-3 w-3 me-1" />
                          ) : (
                            <AlertCircle className="h-3 w-3 me-1" />
                          )}
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(a.requestedAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                        {a.clientComment ?? a.internalComment ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </InternalLayout>
  );
}
