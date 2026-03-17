import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetPlants, useCreatePlant, useUpdatePlant, useDeletePlant, useGetCategories, Plant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit, Plus, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

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

export default function AdminPlants() {
  const [search, setSearch] = useState("");
  const { data: plants, isLoading } = useGetPlants({ search: search || undefined });
  const { data: categories } = useGetCategories();
  const createMut = useCreatePlant();
  const updateMut = useUpdatePlant();
  const deleteMut = useDeletePlant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);

  const form = useForm<z.infer<typeof plantSchema>>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      nameAr: "", nameEn: "", price: 0, stockQuantity: 0, featured: false
    }
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
    form.reset({
      nameAr: "", nameEn: "", price: 0, stockQuantity: 0, featured: false, imageUrl: "", descriptionAr: "", descriptionEn: ""
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof plantSchema>) => {
    if (editingPlant) {
      updateMut.mutate({ id: editingPlant.id, data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
          setIsDialogOpen(false);
          toast({ title: "Plant updated" });
        }
      });
    } else {
      createMut.mutate({ data: values }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
          setIsDialogOpen(false);
          toast({ title: "Plant created" });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this plant?")) {
      deleteMut.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/plants'] });
          toast({ title: "Plant deleted" });
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Plants Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove plants from your catalog.</p>
        </div>
        
        <Button onClick={openCreate} className="rounded-xl px-6">
          <Plus className="mr-2 h-4 w-4" /> Add New Plant
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/10">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search plants..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name (EN)</TableHead>
              <TableHead>Name (AR)</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : plants?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No plants found.</TableCell></TableRow>
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
                    <span className={plant.stockQuantity < 5 ? "text-destructive font-bold" : ""}>
                      {plant.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    {plant.stockQuantity > 0 ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">In Stock</Badge>
                    ) : (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(plant)}>
                        <Edit className="h-4 w-4" />
                      </Button>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlant ? 'Edit Plant' : 'Add New Plant'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="nameEn" render={({ field }) => (
                  <FormItem><FormLabel>Name (English)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="nameAr" render={({ field }) => (
                  <FormItem><FormLabel>Name (Arabic)</FormLabel><FormControl><Input dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="stockQuantity" render={({ field }) => (
                  <FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>

              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="descriptionEn" render={({ field }) => (
                  <FormItem><FormLabel>Description (EN)</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="descriptionAr" render={({ field }) => (
                  <FormItem><FormLabel>Description (AR)</FormLabel><FormControl><Textarea className="resize-none" dir="rtl" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {editingPlant ? 'Save Changes' : 'Create Plant'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
