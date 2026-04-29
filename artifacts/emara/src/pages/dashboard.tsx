import {
  useGetDashboardStats,
  useGetRecentProjects,
  useGetPendingApprovals,
  useGetUpcomingPayments,
  useGetOverdueStages,
} from "@workspace/api-client-react";
import InternalLayout from "@/components/layout/InternalLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  FolderKanban,
  FileText,
  CheckSquare,
  Wallet,
  Users,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  formatEGP,
  formatDate,
  projectStatusLabels,
} from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function DashboardPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: recentProjects } = useGetRecentProjects();
  const { data: pendingApprovals } = useGetPendingApprovals();
  const { data: upcomingPayments } = useGetUpcomingPayments();
  const { data: overdueStages } = useGetOverdueStages();

  const kpis = [
    {
      label: "مشاريع نشطة",
      value: stats?.activeProjects ?? 0,
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "موافقات مطلوبة",
      value: stats?.pendingApprovals ?? 0,
      icon: CheckSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "دفعات معلقة",
      value: stats?.pendingPayments ?? 0,
      icon: Wallet,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "إجمالي المحصل",
      value: formatEGP(stats?.totalPaid ?? 0),
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "إجمالي العملاء",
      value: stats?.totalClients ?? 0,
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "مراحل متأخرة",
      value: stats?.overdueStages ?? 0,
      icon: AlertTriangle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <InternalLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">نظرة عامة</h1>
          <p className="text-muted-foreground">
            أهلاً بك مرة أخرى في لوحة تحكم عمارة.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi, i) => (
            <Card key={i} className="border-card-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <div className={`${kpi.bg} ${kpi.color} p-2 rounded-full`}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-card-border overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                موافقات معلقة ({pendingApprovals?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {pendingApprovals?.slice(0, 5).map((a) => (
                  <Link key={a.id} href={`/projects/${a.projectId}`}>
                    <a className="block p-4 hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-medium">{a.stageName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {a.projectName} — {a.clientName}
                      </p>
                    </a>
                  </Link>
                ))}
                {(!pendingApprovals || pendingApprovals.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    لا توجد موافقات معلقة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                دفعات قادمة ({upcomingPayments?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {upcomingPayments?.slice(0, 5).map((p) => (
                  <div key={p.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.projectName} — {formatDate(p.dueDate)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-500">
                      {formatEGP(p.amount)}
                    </p>
                  </div>
                ))}
                {(!upcomingPayments || upcomingPayments.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    لا توجد دفعات قادمة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                مراحل متأخرة ({overdueStages?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {overdueStages?.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/projects/${s.projectId}`}>
                    <a className="block p-4 hover:bg-muted/30 transition-colors">
                      <p className="text-sm font-medium">{s.stageName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.projectName} — استحقاق {formatDate(s.dueDate)}
                      </p>
                    </a>
                  </Link>
                ))}
                {(!overdueStages || overdueStages.length === 0) && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    لا توجد مراحل متأخرة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-card-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>أحدث المشاريع</CardTitle>
              <CardDescription>
                آخر المشاريع التي تمت إضافتها أو تحديثها
              </CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                عرض الكل
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المساحة</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ البدء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProjects?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/projects/${p.id}`}>
                        <a className="hover:underline">{p.projectName}</a>
                      </Link>
                    </TableCell>
                    <TableCell>{p.clientName}</TableCell>
                    <TableCell>{p.areaSqm} م²</TableCell>
                    <TableCell>{p.progressPercent}%</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {projectStatusLabels[p.status] ?? p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(p.startDate)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!recentProjects || recentProjects.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      لا توجد مشاريع بعد
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
