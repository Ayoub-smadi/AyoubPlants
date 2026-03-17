import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import {
  useGetCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { z } from "zod";
import { Edit, Plus, Trash2, Tags } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const categorySchema = z.object({
  nameAr: z.string().min(1, "الاسم بالعربية مطلوب"),
  nameEn: z.string().min(1, "الاسم بالإنجليزية مطلوب"),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

type Category = {
  id: number;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  createdAt: string;
};

export default function AdminCategories() {
  const { data: categories, isLoading } = useGetCategories();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const deleteMut = useDeleteCategory();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { nameAr: "", nameEn: "", description: "" },
  });

  const openCreate = () => {
    setEditingCategory(null);
    form.reset({ nameAr: "", nameEn: "", description: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    form.reset({
      nameAr: cat.nameAr,
      nameEn: cat.nameEn,
      description: cat.description || "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: CategoryFormValues) => {
    if (editingCategory) {
      updateMut.mutate(
        { id: editingCategory.id, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            setIsDialogOpen(false);
            toast({ title: "تم تحديث الفئة بنجاح" });
          },
          onError: () => {
            toast({ title: "فشل تحديث الفئة", variant: "destructive" });
          },
        }
      );
    } else {
      createMut.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            setIsDialogOpen(false);
            toast({ title: "تمت إضافة الفئة بنجاح" });
          },
          onError: () => {
            toast({ title: "فشل إضافة الفئة", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleDelete = (id: number, nameEn: string) => {
    if (confirm(`هل أنت متأكد من حذف فئة "${nameEn}"؟`)) {
      deleteMut.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
            toast({ title: "تم حذف الفئة" });
          },
          onError: () => {
            toast({ title: "فشل حذف الفئة", variant: "destructive" });
          },
        }
      );
    }
  };

  const isPending =
    createMut.isPending || updateMut.isPending || deleteMut.isPending;

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفئات</h1>
          <p className="text-muted-foreground">
            أضف أو عدّل أو احذف فئات النباتات.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-xl px-6">
          <Plus className="mr-2 h-4 w-4" /> إضافة فئة
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>#</TableHead>
              <TableHead>الاسم بالعربية</TableHead>
              <TableHead>الاسم بالإنجليزية</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            ) : !categories || categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Tags className="h-10 w-10 opacity-40" />
                    <p className="text-lg font-medium">لا توجد فئات بعد</p>
                    <Button variant="outline" onClick={openCreate} className="mt-1">
                      <Plus className="mr-2 h-4 w-4" /> إضافة أول فئة
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              (categories as Category[]).map((cat) => (
                <TableRow key={cat.id} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {cat.id}
                  </TableCell>
                  <TableCell className="font-medium">{cat.nameAr}</TableCell>
                  <TableCell>{cat.nameEn}</TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                    {cat.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {cat.createdAt
                      ? format(new Date(cat.createdAt), "MMM dd, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => openEdit(cat)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(cat.id, cat.nameEn)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCategory ? "تعديل الفئة" : "إضافة فئة جديدة"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-2"
            >
              <FormField
                control={form.control}
                name="nameAr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالعربية *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="مثال: نباتات داخلية"
                        dir="rtl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم بالإنجليزية *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Indoor Plants" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="وصف مختصر للفئة..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isPending} className="px-6">
                  {isPending
                    ? "جاري الحفظ..."
                    : editingCategory
                    ? "حفظ التغييرات"
                    : "إضافة الفئة"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
