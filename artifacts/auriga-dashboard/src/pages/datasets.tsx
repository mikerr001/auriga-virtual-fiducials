import { useState } from "react";
import { useListDatasets, useDeleteDataset, useCreateDataset, getListDatasetsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name required"),
  source: z.enum(["data-factory", "synthetic", "manual", "external"]),
  sampleCount: z.coerce.number().positive(),
  status: z.enum(["approved", "pending", "rejected"]),
  distanceRangeMinM: z.coerce.number().positive(),
  distanceRangeMaxM: z.coerce.number().positive()
});

export default function Datasets() {
  const { data: datasets, isLoading } = useListDatasets();
  const deleteDataset = useDeleteDataset();
  const createDataset = useCreateDataset();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      source: "synthetic",
      sampleCount: 1000,
      status: "pending",
      distanceRangeMinM: 0.1,
      distanceRangeMaxM: 5.0
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Delete this dataset?")) {
      deleteDataset.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDatasetsQueryKey() });
          toast({ title: "Dataset deleted" });
        }
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createDataset.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDatasetsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Dataset registered" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
            <Database className="h-6 w-6" />
            Dataset Registry
          </h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">Manage validation and test datasets for engine evaluation</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Plus className="mr-2 h-4 w-4" />
              Register Dataset
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Register New Dataset
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Dataset Name</FormLabel>
                    <FormControl><Input className="font-mono" placeholder="e.g. Synthetic Low-Light v2" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="source" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Source Setup</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Source" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="synthetic" className="font-mono">Synthetic</SelectItem>
                          <SelectItem value="data-factory" className="font-mono">Data Factory</SelectItem>
                          <SelectItem value="manual" className="font-mono">Manual</SelectItem>
                          <SelectItem value="external" className="font-mono">External</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending" className="font-mono">Pending</SelectItem>
                          <SelectItem value="approved" className="font-mono">Approved</SelectItem>
                          <SelectItem value="rejected" className="font-mono">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sampleCount" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-mono">Sample Count</FormLabel>
                      <FormControl><Input className="font-mono" type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="distanceRangeMinM" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Range Min (m)</FormLabel>
                      <FormControl><Input className="font-mono" type="number" step="0.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="distanceRangeMaxM" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Range Max (m)</FormLabel>
                      <FormControl><Input className="font-mono" type="number" step="0.1" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono">Cancel</Button>
                  <Button type="submit" disabled={createDataset.isPending} className="font-mono">Register Dataset</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-mono text-xs font-semibold uppercase">Dataset Name</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Source</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Samples</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Range (Min/Max)</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : datasets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-mono text-sm border-dashed border border-border m-4 rounded-sm">
                    No datasets registered in the system.
                  </TableCell>
                </TableRow>
              ) : datasets?.map((dataset) => (
                <TableRow key={dataset.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium font-mono text-sm">{dataset.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground uppercase">{dataset.source.replace('-', ' ')}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary">{dataset.sampleCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {dataset.distanceRangeMinM.toFixed(1)}m - {dataset.distanceRangeMaxM.toFixed(1)}m
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`font-mono text-[10px] uppercase tracking-wider ${
                        dataset.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        dataset.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      }`}
                    >
                      {dataset.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(dataset.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}