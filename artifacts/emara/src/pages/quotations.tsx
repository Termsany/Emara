import { useListProjects, useGetProjectQuotation } from "@workspace/api-client-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { formatEGP } from "@/lib/format";

function QuotationRow({ project }: { project: { id: number; projectName: string; clientName: string; areaSqm: number } }) {
  const { data: q } = useGetProjectQuotation(project.id);
  if (!q) {
    return (
      <TableRow>
        <TableCell className="font-medium">{project.projectName}</TableCell>
        <TableCell>{project.clientName}</TableCell>
        <TableCell>{project.areaSqm} م²</TableCell>
        <TableCell>—</TableCell>
        <TableCell>—</TableCell>
        <TableCell>
          <Badge variant="outline">لم يُنشأ</Badge>
        </TableCell>
        <TableCell className="text-end">
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="sm">إنشاء</Button>
          </Link>
        </TableCell>
      </TableRow>
    );
  }
  return (
    <TableRow>
      <TableCell className="font-medium">{project.projectName}</TableCell>
      <TableCell>{project.clientName}</TableCell>
      <TableCell>{q.areaSqm} م²</TableCell>
      <TableCell>{formatEGP(q.pricePerSqm)}</TableCell>
      <TableCell className="font-semibold">{formatEGP(q.finalTotal)}</TableCell>
      <TableCell>
        <Badge
          variant={q.status === "approved" ? "default" : q.status === "rejected" ? "destructive" : "secondary"}
        >
          {q.status === "draft"
            ? "مسودة"
            : q.status === "sent"
              ? "مُرسل"
              : q.status === "approved"
                ? "مُعتمد"
                : "مرفوض"}
        </Badge>
      </TableCell>
      <TableCell className="text-end">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="sm">عرض</Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}

export default function QuotationsPage() {
  const { data: projects, isLoading } = useListProjects();

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">عروض الأسعار</h1>
          <p className="text-muted-foreground">
            إدارة عروض الأسعار لجميع المشاريع.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>جميع العروض</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المساحة</TableHead>
                  <TableHead>سعر المتر</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : (
                  projects?.map((p) => <QuotationRow key={p.id} project={p} />)
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </InternalLayout>
  );
}
