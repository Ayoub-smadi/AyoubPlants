import { useState, useRef } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetPlants, useCreatePlant, useUpdatePlant, useDeletePlant, useGetCategories, Plant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Plus, Trash2, Search, Upload, Download, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/lib/store";

const TREE_MIN_QTY = 10;

const plantSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  categoryId: z.coerce.number().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  price: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().min(0),
  imageUrl: z.string().optional(),
  featured: z.boolean().default(false)
});

type CsvRow = {
  nameEn: string;
  nameAr: string;
  categoryId?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  height?: string;
  price: string;
  stockQuantity: string;
  imageUrl?: string;
  featured?: string;
  _valid: boolean;
  _errors: string[];
};

const CSV_HEADERS = ["nameEn","nameAr","categoryId","descriptionEn","descriptionAr","height","price","stockQuantity","imageUrl","featured"];

const TEMPLATE_CSV = `nameEn,nameAr,categoryId,descriptionEn,descriptionAr,height,price,stockQuantity,imageUrl,featured
Date Palm,نخيل تمر,1,A beautiful date palm,شجرة نخيل جميلة,5,450,20,https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400,true
Rose Bush,ورد الجوري,2,Fragrant roses in vibrant colors,ورد جوري عطري,1.2,85,30,,false
Peace Lily,زنبق السلام,4,Elegant indoor plant,نبات منزلي أنيق,0.8,75,18,,false`;

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = values[idx] || ""; });

    const errors: string[] = [];
    if (!obj.nameEn) errors.push("nameEn مطلوب");
    if (!obj.nameAr) errors.push("nameAr مطلوب");
    if (!obj.price || isNaN(Number(obj.price))) errors.push("price يجب أن يكون رقماً");
    if (!obj.stockQuantity || isNaN(Number(obj.stockQuantity))) errors.push("stockQuantity يجب أن يكون رقماً");

    rows.push({
      nameEn: obj.nameEn || "",
      nameAr: obj.nameAr || "",
      categoryId: obj.categoryId,
      descriptionEn: obj.descriptionEn,
      descriptionAr: obj.descriptionAr,
      height: obj.height,
      price: obj.price,
      stockQuantity: obj.stockQuantity,
      imageUrl: obj.imageUrl,
      featured: obj.featured,
      _valid: errors.length === 0,
      _errors: errors,
    });
  }
  return rows;
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plants_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPlants() {
  const [search, setSearch] = useState("");
  const { data: plants, isLoading } = useGetPlants({ search: search || undefined });
  const { data: categories } = useGetCategories();
  const createMut = useCreatePlant();
  const updateMut = useUpdatePlant();
  const deleteMut = useDeletePlant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);

  const [isCsvDialogOpen, setIsCsvDialogOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; total: number; results: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof plantSchema>>({
    resolver: zodResolver(plantSchema),
    defaultValues: { nameAr: "", nameEn: "", price: 0, stockQuantity: 0, featured: false }
  });

  const openEdit = (plant: Plant) => {
    setEditingPlant(plant);
    form.reset({
      nameAr: plant.nameAr,
      nameEn: plant.nameEn,
      categoryId: plant.categoryId || undefined,
      descriptionAr: plant.descriptionAr || "",
      descriptionEn: plant.descriptionEn || "",
      price: plant.price,
      stockQuantity: plant.stockQuantity,
      imageUrl: plant.imageUrl || "",
      featured: plant.featured
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingPlant(null);
    form.reset({ nameAr: "", nameEn: "", price: 0, stockQuantity: 0, featured: false, imageUrl: "", descriptionAr: "", descriptionEn: "" });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof plantSchema>) => {
    if (editingPlant) {
      updateMut.mutate({ id: editingPlant.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
          setIsDialogOpen(false);
          toast({ title: "تم تحديث النبات" });
        }
      });
    } else {
      createMut.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
          setIsDialogOpen(false);
          toast({ title: "تمت إضافة النبات" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا النبات؟")) {
      deleteMut.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
          toast({ title: "تم حذف النبات" });
        }
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setCsvRows(rows);
    };
    reader.readAsText(file);
  };

  const openCsvDialog = () => {
    setCsvRows([]);
    setCsvFileName("");
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsCsvDialogOpen(true);
  };

  const handleImport = async () => {
    const validRows = csvRows.filter(r => r._valid);
    if (validRows.length === 0) return;
    setImportLoading(true);
    try {
      const res = await fetch("/api/plants/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ plants: validRows }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.imported > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
        toast({ title: `تم استيراد ${data.imported} نبات بنجاح!` });
      }
    } catch (err) {
      toast({ title: "فشل الاستيراد", variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const validCount = csvRows.filter(r => r._valid).length;
  const invalidCount = csvRows.filter(r => !r._valid).length;

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">إدارة النباتات</h1>
          <p className="text-muted-foreground">أضف أو عدّل أو احذف النباتات من الكتالوج.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={openCsvDialog} className="rounded-xl px-5 border-primary/40 text-primary hover:bg-primary/5">
            <Upload className="mr-2 h-4 w-4" /> استيراد CSV
          </Button>
          <Button onClick={openCreate} className="rounded-xl px-6">
            <Plus className="mr-2 h-4 w-4" /> إضافة نبات
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن نبات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-16">صورة</TableHead>
              <TableHead>الاسم (EN)</TableHead>
              <TableHead>الاسم (AR)</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>المخزون</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">جاري التحميل...</TableCell></TableRow>
            ) : plants?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد نباتات.</TableCell></TableRow>
            ) : (
              plants?.map((plant) => (
                <TableRow key={plant.id}>
                  <TableCell>
                    <div className="w-10 h-10 rounded-md bg-muted overflow-hidden">
                      {plant.imageUrl && <img src={plant.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{plant.nameEn}</TableCell>
                  <TableCell dir="rtl">{plant.nameAr}</TableCell>
                  <TableCell>${plant.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={plant.stockQuantity < 5 ? "text-destructive font-bold" : ""}>{plant.stockQuantity}</span>
                  </TableCell>
                  <TableCell>
                    {plant.stockQuantity > 0 ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">متوفر</Badge>
                    ) : (
                      <Badge variant="destructive">نفذ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(plant)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(plant.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlant ? 'تعديل النبات' : 'إضافة نبات جديد'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem><FormLabel>الاسم (إنجليزي)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="nameAr" render={({ field }) => (
                  <FormItem><FormLabel>الاسم (عربي)</FormLabel><FormControl><Input dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>السعر ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="stockQuantity" render={({ field }) => (
                  <FormItem><FormLabel>الكمية</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>رابط الصورة</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                  <FormItem><FormLabel>الوصف (EN)</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                  <FormItem><FormLabel>الوصف (AR)</FormLabel><FormControl><Textarea className="resize-none" dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editingPlant ? 'حفظ التعديلات' : 'إضافة النبات'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={isCsvDialogOpen} onOpenChange={setIsCsvDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              استيراد نباتات من CSV
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">

            {/* Format guide */}
            <div className="bg-muted/40 border border-border/50 rounded-xl p-4 text-sm space-y-2">
              <p className="font-semibold text-foreground">📋 الخانات المطلوبة في ملف CSV:</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
                <span><span className="text-primary font-mono font-semibold">nameEn</span> — الاسم بالإنجليزي <span className="text-destructive text-xs">*مطلوب</span></span>
                <span><span className="text-primary font-mono font-semibold">nameAr</span> — الاسم بالعربي <span className="text-destructive text-xs">*مطلوب</span></span>
                <span><span className="text-primary font-mono font-semibold">price</span> — السعر (رقم) <span className="text-destructive text-xs">*مطلوب</span></span>
                <span><span className="text-primary font-mono font-semibold">stockQuantity</span> — الكمية (رقم) <span className="text-destructive text-xs">*مطلوب</span></span>
                <span><span className="font-mono text-xs">categoryId</span> — رقم الفئة (1=أشجار، 2=زهور، 3=شجيرات، 4=داخلية)</span>
                <span><span className="font-mono text-xs">height</span> — الارتفاع بالمتر</span>
                <span><span className="font-mono text-xs">descriptionEn</span> — وصف إنجليزي</span>
                <span><span className="font-mono text-xs">descriptionAr</span> — وصف عربي</span>
                <span><span className="font-mono text-xs">imageUrl</span> — رابط صورة</span>
                <span><span className="font-mono text-xs">featured</span> — مميز؟ (true/false)</span>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-2 text-xs h-8 rounded-lg border-primary/30 text-primary hover:bg-primary/5">
                <Download className="mr-1 h-3 w-3" /> تنزيل قالب CSV جاهز
              </Button>
            </div>

            {/* File Upload */}
            {!importResult && (
              <div
                className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                {csvFileName ? (
                  <p className="font-semibold text-foreground">{csvFileName}</p>
                ) : (
                  <>
                    <p className="font-semibold">اضغط لرفع ملف CSV</p>
                    <p className="text-sm text-muted-foreground mt-1">أو اسحب الملف وأفلته هنا</p>
                  </>
                )}
              </div>
            )}

            {/* Preview Table */}
            {csvRows.length > 0 && !importResult && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">معاينة البيانات ({csvRows.length} صف)</p>
                  <div className="flex gap-3 text-sm">
                    {validCount > 0 && <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" />{validCount} صحيح</span>}
                    {invalidCount > 0 && <span className="text-destructive flex items-center gap-1"><XCircle className="h-4 w-4" />{invalidCount} خطأ</span>}
                  </div>
                </div>
                <div className="border border-border/50 rounded-xl overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>nameEn</TableHead>
                        <TableHead>nameAr</TableHead>
                        <TableHead>price</TableHead>
                        <TableHead>stock</TableHead>
                        <TableHead>catId</TableHead>
                        <TableHead>الحالة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvRows.map((row, i) => (
                        <TableRow key={i} className={!row._valid ? "bg-destructive/5" : ""}>
                          <TableCell className="text-muted-foreground text-xs">{i + 2}</TableCell>
                          <TableCell className="font-medium text-sm">{row.nameEn || <span className="text-destructive italic">فارغ</span>}</TableCell>
                          <TableCell dir="rtl" className="text-sm">{row.nameAr || <span className="text-destructive italic">فارغ</span>}</TableCell>
                          <TableCell className="text-sm">{row.price}</TableCell>
                          <TableCell className="text-sm">{row.stockQuantity}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.categoryId || "—"}</TableCell>
                          <TableCell>
                            {row._valid ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                <span className="text-xs text-destructive">{row._errors.join(", ")}</span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {invalidCount > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    الصفوف التي بها أخطاء لن يتم استيرادها. سيتم استيراد {validCount} صف فقط.
                  </p>
                )}
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  تم الاستيراد بنجاح!
                </p>
                <p className="text-green-600 dark:text-green-500">
                  تم إضافة <strong>{importResult.imported}</strong> نبات من أصل {importResult.total} صف
                </p>
                {importResult.results.filter((r: any) => !r.success).length > 0 && (
                  <div className="mt-3 text-sm text-destructive text-right">
                    <p className="font-semibold">الصفوف الفاشلة:</p>
                    {importResult.results.filter((r: any) => !r.success).map((r: any) => (
                      <p key={r.index}>• {r.nameEn}: {r.error}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsCsvDialogOpen(false)}>
                {importResult ? "إغلاق" : "إلغاء"}
              </Button>
              {!importResult && csvRows.length > 0 && validCount > 0 && (
                <Button onClick={handleImport} disabled={importLoading} className="px-6">
                  {importLoading ? "جاري الاستيراد..." : `استيراد ${validCount} نبات`}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
