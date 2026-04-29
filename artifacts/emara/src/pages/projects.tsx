import {
  useListProjects,
  useCreateProject,
  useListClients,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import InternalLayout from "@/components/layout/InternalLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search } from "lucide-react";
import {
  formatDate,
  projectStatusLabels,
  projectTypeLabels,
  designStyleLabels,
  scopeTypeLabels,
} from "@/lib/format";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

const projectSchema = z.object({
  projectName: z.string().min(2, "الاسم مطلوب"),
  clientId: z.string().min(1, "العميل مطلوب"),
  projectType: z.enum(["villa", "apartment", "office", "clinic", "retail_store", "restaurant", "other"]),
  designStyle: z.enum([
    "modern",
    "classic",
    "neoclassical",
    "minimal",
    "japandi",
    "industrial",
    "contemporary",
    "luxury",
  ]),
  scopeType: z.enum([
    "design_only",
    "design_shop_drawings",
    "design_supervision",
    "design_execution",
    "turnkey",
  ]),
  areaSqm: z.string().min(1, "المساحة مطلوبة"),
  location: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
});

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const { data: projects, isLoading } = useListProjects();
  const { data: clients } = useListClients();
  const createProject = useCreateProject();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: "",
      clientId: "",
      projectType: "villa",
      designStyle: "modern",
      scopeType: "design_only",
      areaSqm: "",
      location: "",
      budget: "",
      notes: "",
    },
  });

  const onSubmit = (data: z.infer<typeof projectSchema>) => {
    createProject.mutate(
      {
        data: {
          projectName: data.projectName,
          clientId: Number(data.clientId),
          projectType: data.projectType,
          designStyle: data.designStyle,
          scopeType: data.scopeType,
          areaSqm: Number(data.areaSqm),
          location: data.location || null,
          budget: data.budget ? Number(data.budget) : null,
          notes: data.notes || null,
          status: "new_lead",
        },
      },
      {
        onSuccess: () => {
          toast.success("تم إنشاء المشروع بنجاح");
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          form.reset();
          setOpen(false);
        },
        onError: () => {
          toast.error("فشل إنشاء المشروع");
        },
      },
    );
  };

  const filteredProjects = projects?.filter((p) => {
    const matchesSearch = p.projectName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">المشاريع</h1>
            <p className="text-muted-foreground">
              إدارة وتتبع جميع مشاريع التصميم.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> مشروع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء مشروع جديد</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 py-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المشروع</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>العميل</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر العميل" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients?.map((c) => (
                                <SelectItem key={c.id} value={c.id.toString()}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="projectType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>النوع</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(projectTypeLabels).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="designStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الطراز</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(designStyleLabels).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="scopeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نطاق العمل</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(scopeTypeLabels).map(([k, v]) => (
                                <SelectItem key={k} value={k}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="areaSqm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المساحة (م²)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الميزانية (ج.م)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموقع</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createProject.isPending}
                  >
                    {createProject.isPending ? "جارٍ الإنشاء..." : "إنشاء المشروع"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث عن مشروع..."
                  className="ps-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(projectStatusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المشروع</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>المساحة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>تاريخ البدء</TableHead>
                  <TableHead className="text-end">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      جارٍ التحميل...
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.projectName}</TableCell>
                      <TableCell>{p.clientName}</TableCell>
                      <TableCell className="text-xs">
                        {projectTypeLabels[p.projectType] ?? p.projectType}
                      </TableCell>
                      <TableCell>{p.areaSqm} م²</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {projectStatusLabels[p.status] ?? p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{p.progressPercent}%</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(p.startDate)}
                      </TableCell>
                      <TableCell className="text-end">
                        <Link href={`/projects/${p.id}`}>
                          <Button variant="ghost" size="sm">
                            إدارة
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {filteredProjects?.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      لا توجد مشاريع
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
