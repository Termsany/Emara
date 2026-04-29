import {
  useListProjects,
  useListProjectBoq,
  getListProjectBoqQueryKey,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { formatEGP, boqCategoryLabels, boqUnitLabels } from "@/lib/format";

export default function BoqPage() {
  const { data: projects } = useListProjects();
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    if (!selectedProject && projects && projects.length > 0) {
      setSelectedProject(projects[0].id.toString());
    }
  }, [projects, selectedProject]);

  const projectId = selectedProject ? Number(selectedProject) : 0;
  const { data: items, isLoading } = useListProjectBoq(projectId, {
    query: {
      queryKey: getListProjectBoqQueryKey(projectId),
      enabled: projectId > 0,
    },
  });

  const total = items?.reduce((sum, i) => sum + i.totalPrice, 0) ?? 0;

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">جدول الكميات (BOQ)</h1>
            <p className="text-muted-foreground">
              تفاصيل بنود التنفيذ والكميات لكل مشروع.
            </p>
          </div>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="اختر مشروعاً" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>البنود</CardTitle>
            <div className="text-end">
              <p className="text-xs text-muted-foreground">الإجمالي</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatEGP(total)}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البند</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>سعر الوحدة</TableHead>
                  <TableHead className="text-end">الإجمالي</TableHead>
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
                  items?.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.itemName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {boqCategoryLabels[i.category] ?? i.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                        {i.description ?? "—"}
                      </TableCell>
                      <TableCell>{i.quantity}</TableCell>
                      <TableCell className="text-xs">
                        {boqUnitLabels[i.unit] ?? i.unit}
                      </TableCell>
                      <TableCell>{formatEGP(i.unitPrice)}</TableCell>
                      <TableCell className="text-end font-semibold">
                        {formatEGP(i.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {!isLoading && (!items || items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      لا توجد بنود في هذا المشروع
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
