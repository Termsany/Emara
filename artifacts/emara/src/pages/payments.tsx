import {
  useGetUpcomingPayments,
  useUpdatePayment,
  getGetUpcomingPaymentsQueryKey,
} from "@workspace/api-client-react";
import InternalLayout from "@/components/layout/InternalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle2 } from "lucide-react";
import { formatEGP, formatDate, paymentStatusLabels } from "@/lib/format";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

export default function PaymentsPage() {
  const { data: payments, isLoading } = useGetUpcomingPayments();
  const markPaid = useUpdatePayment();

  const handleMarkPaid = (id: number) => {
    markPaid.mutate(
      {
        id,
        data: { status: "paid", paidDate: new Date().toISOString() },
      },
      {
        onSuccess: () => {
          toast.success("تم تسجيل الدفعة كمدفوعة");
          queryClient.invalidateQueries({ queryKey: getGetUpcomingPaymentsQueryKey() });
        },
        onError: () => toast.error("فشل تحديث الدفعة"),
      },
    );
  };

  const totalDue = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const overdueCount = payments?.filter((p) => p.status === "overdue").length ?? 0;

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">المدفوعات</h1>
          <p className="text-muted-foreground">
            متابعة الدفعات المستحقة والمتأخرة لجميع المشاريع.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">إجمالي المستحق</p>
              <p className="text-2xl font-bold mt-1">{formatEGP(totalDue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">عدد الدفعات</p>
              <p className="text-2xl font-bold mt-1">{payments?.length ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">دفعات متأخرة</p>
              <p className="text-2xl font-bold mt-1 text-rose-500">
                {overdueCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الدفعات المستحقة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : (
                  payments?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.projectName}</TableCell>
                      <TableCell>{p.title}</TableCell>
                      <TableCell className="font-semibold">{formatEGP(p.amount)}</TableCell>
                      <TableCell className="text-xs">{formatDate(p.dueDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.status === "overdue"
                              ? "destructive"
                              : p.status === "paid"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {paymentStatusLabels[p.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleMarkPaid(p.id)}
                          disabled={markPaid.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          تسجيل دفع
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && payments?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      لا توجد دفعات مستحقة
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  );
}
