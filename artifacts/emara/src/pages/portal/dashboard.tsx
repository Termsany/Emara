import {
  useListProjects,
} from "@workspace/api-client-react";
import ClientLayout from "@/components/layout/ClientLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, FolderKanban, Sparkles } from "lucide-react";
import {
  formatDate,
  projectStatusLabels,
  projectTypeLabels,
} from "@/lib/format";

export default function PortalDashboardPage() {
  const { data: projects, isLoading } = useListProjects();

  return (
    <ClientLayout>
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            بوابة العميل
          </div>
          <h1 className="text-4xl font-bold tracking-tight">مرحباً بك</h1>
          <p className="text-muted-foreground mt-2">
            تابع تقدم مشاريعك ومراحل التصميم في مكان واحد.
          </p>
        </div>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-primary" />
              مشاريعي ({projects?.length ?? 0})
            </CardTitle>
            <CardDescription>
              جميع المشاريع المتابعة معنا حالياً
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="text-center py-10 text-muted-foreground">
                جارٍ التحميل...
              </div>
            )}
            {projects?.map((p) => (
              <Card key={p.id} className="hover:border-primary transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold">{p.projectName}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{projectTypeLabels[p.projectType] ?? p.projectType}</span>
                          <span>•</span>
                          <span>{p.areaSqm} م²</span>
                          {p.location && (
                            <>
                              <span>•</span>
                              <span>{p.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">التقدم</span>
                          <span className="font-semibold">{p.progressPercent}%</span>
                        </div>
                        <Progress value={p.progressPercent} className="h-2" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="secondary">
                          {projectStatusLabels[p.status] ?? p.status}
                        </Badge>
                        {p.startDate && <span>بدأ في {formatDate(p.startDate)}</span>}
                      </div>
                    </div>
                    <Link href={`/portal/projects/${p.id}`}>
                      <Button size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        التفاصيل
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!isLoading && projects?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                لا توجد مشاريع بعد
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}
