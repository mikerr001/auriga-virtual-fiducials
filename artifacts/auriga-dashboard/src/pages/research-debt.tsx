import { useState } from "react";
import { useListResearchDebt, useDeleteResearchDebt, useCreateResearchDebt, getListResearchDebtQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.enum(["estimation-accuracy", "calibration", "dataset", "validation", "observability", "performance", "other"]),
});

export default function ResearchDebt() {
  const { data: debt, isLoading } = useListResearchDebt();
  const deleteDebt = useDeleteResearchDebt();
  const createDebt = useCreateResearchDebt();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      severity: "medium",
      category: "estimation-accuracy"
    }
  });

  const handleDelete = (id: number) => {
    if (confirm("Delete this research debt entry?")) {
      deleteDebt.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListResearchDebtQueryKey() });
          toast({ title: "Entry deleted" });
        }
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createDebt.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListResearchDebtQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Issue logged successfully" });
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/50';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'low': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Research Debt Ledger
          </h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">Track and prioritize outstanding research and accuracy issues</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Plus className="mr-2 h-4 w-4" />
              Log Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-mono">Log Research Debt</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Issue Title</FormLabel>
                    <FormControl><Input className="font-mono" placeholder="Short description of problem" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Detailed Context</FormLabel>
                    <FormControl><Textarea className="font-mono min-h-[100px]" placeholder="Explain the impact and context..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="severity" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Severity</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Severity" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="critical" className="font-mono">Critical</SelectItem>
                          <SelectItem value="high" className="font-mono">High</SelectItem>
                          <SelectItem value="medium" className="font-mono">Medium</SelectItem>
                          <SelectItem value="low" className="font-mono">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="estimation-accuracy" className="font-mono">Estimation Accuracy</SelectItem>
                          <SelectItem value="calibration" className="font-mono">Calibration</SelectItem>
                          <SelectItem value="dataset" className="font-mono">Dataset</SelectItem>
                          <SelectItem value="validation" className="font-mono">Validation</SelectItem>
                          <SelectItem value="observability" className="font-mono">Observability</SelectItem>
                          <SelectItem value="performance" className="font-mono">Performance</SelectItem>
                          <SelectItem value="other" className="font-mono">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono">Cancel</Button>
                  <Button type="submit" disabled={createDebt.isPending} className="font-mono">Save Issue</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-20 w-full mb-4" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))
        ) : debt?.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-muted-foreground font-mono text-sm border border-dashed border-border rounded-lg bg-muted/20">
            No active research debt. System is clean.
          </div>
        ) : debt?.map((item) => (
          <Card key={item.id} className="flex flex-col relative group border-border bg-card hover:border-primary/50 transition-colors">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity z-10"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className={`font-mono text-[9px] uppercase tracking-wider ${getSeverityColor(item.severity)}`}>
                  {item.severity}
                </Badge>
                <span className="font-mono text-[10px] text-muted-foreground">ID:{item.id.toString().padStart(4, '0')}</span>
              </div>
              <CardTitle className="text-sm leading-tight font-semibold tracking-wide pr-6">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col px-5 pb-5">
              <p className="text-xs text-muted-foreground mb-6 flex-1 line-clamp-3 leading-relaxed">{item.description}</p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">{item.category.replace('-', ' ')}</span>
                <span className="text-[10px] font-mono font-medium text-primary uppercase tracking-wider">{item.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}