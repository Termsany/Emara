import {
  useListAllFiles,
  useDeleteFile,
  getListAllFilesQueryKey,
} from "@workspace/api-client-react";
import InternalLayout from "@/components/layout/InternalLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileIcon,
  FolderOpen,
  Search,
  Download,
  Trash2,
  Lock,
} from "lucide-react";
import { useState } from "react";
import {
  formatRelativeTime,
  fileCategoryLabels,
} from "@/lib/format";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";

export default function FilesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: files, isLoading } = useListAllFiles();
  const deleteFile = useDeleteFile();

  const filteredFiles = files?.filter((f) =>
    f.fileName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;
    deleteFile.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("تم حذف الملف");
          queryClient.invalidateQueries({ queryKey: getListAllFilesQueryKey() });
        },
        onError: () => {
          toast.error("فشل حذف الملف");
        },
      },
    );
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);

  return (
    <InternalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">مكتبة الملفات</h1>
          <p className="text-muted-foreground">
            جميع الملفات المرفوعة عبر جميع المشاريع.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث في الملفات..."
            className="ps-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {isLoading && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              جارٍ التحميل...
            </div>
          )}
          {filteredFiles?.map((f) => (
            <Card
              key={f.id}
              className="overflow-hidden group hover:border-primary transition-colors"
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-muted rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
                  {isImage(f.fileUrl) ? (
                    <img
                      src={f.fileUrl}
                      alt={f.fileName}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <FileIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                  {!f.isPublic && (
                    <Badge
                      variant="secondary"
                      className="absolute top-2 start-2 gap-1 text-[10px]"
                    >
                      <Lock className="h-3 w-3" /> داخلي
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => handleDelete(f.id)}
                      disabled={deleteFile.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate" title={f.fileName}>
                    {f.fileName}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {fileCategoryLabels[f.category] ?? f.category}
                    </Badge>
                    <span className="text-muted-foreground">
                      v{f.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {f.projectName ?? "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(f.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {!isLoading && filteredFiles?.length === 0 && (
            <div className="col-span-full py-20 text-center bg-muted/20 rounded-lg border-2 border-dashed">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا توجد ملفات بعد</p>
            </div>
          )}
        </div>
      </div>
    </InternalLayout>
  );
}
