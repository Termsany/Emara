import { useParams, Link } from "wouter";
import {
  useGetClient,
  useListProjects,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import {
  formatDate,
  projectStatusLabels,
} from "@/lib/format";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const clientId = Number(params.id);
  const { data: client, isLoading } = useGetClient(clientId);
  const { data: allProjects } = useListProjects();
  const clientProjects = allProjects?.filter((p) => p.clientId === clientId);

  if (isLoading || !client) {
    return (
      <InternalLayout>
        <div className="text-center py-20 text-muted-foreground">
          جارٍ التحميل...
        </div>
      </InternalLayout>
    );
  }

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div>
          <Link href="/clients">
            <a className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowRight className="h-3 w-3" /> العودة للعملاء
            </a>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{client.name}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2 rounded-md">
                <Phone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">الهاتف</p>
                <p className="text-sm font-medium" dir="ltr">{client.phone}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2 rounded-md">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">البريد</p>
                <p className="text-sm font-medium" dir="ltr">
                  {client.email ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2 rounded-md">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">العنوان</p>
                <p className="text-sm font-medium">{client.address ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {client.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>مشاريع العميل ({clientProjects?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>المساحة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientProjects?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.projectName}</TableCell>
                    <TableCell>{p.areaSqm} م²</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {projectStatusLabels[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.progressPercent}%</TableCell>
                    <TableCell className="text-end">
                      <Link href={`/projects/${p.id}`}>
                        <Button variant="ghost" size="sm">عرض</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {(!clientProjects || clientProjects.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد مشاريع لهذا العميل
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
