import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import InternalLayout from "@/components/layout/InternalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/format";

export default function SettingsPage() {
  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  return (
    <InternalLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة حسابك وإعدادات النظام.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الملف الشخصي</CardTitle>
            <CardDescription>بيانات حسابك الحالي</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={user?.name ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input value={user?.email ?? ""} disabled dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <div>
                <Badge variant="secondary">
                  {user ? roleLabels[user.role] ?? user.role : "—"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>عن المنصة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">EMARA | عمارة</strong> — منصة
              متكاملة لإدارة مشاريع التصميم الداخلي والمعماري.
            </p>
            <p>الإصدار: 1.0.0 (MVP)</p>
            <p>العملة: الجنيه المصري (ج.م)</p>
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  );
}
