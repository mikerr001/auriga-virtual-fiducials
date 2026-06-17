import { useState } from "react";
import { useListValidationRuns, useCreateValidationRun, useListCalibrationProfiles, getListValidationRunsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, TestTube2 } from "lucide-react";
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
  testType: z.enum(["lighting-variation", "reflective-environment", "partial-occlusion", "adversarial", "standard"]),
  calibrationProfileId: z.coerce.number().positive("Profile required"),
  totalCases: z.coerce.number().positive().min(10)
});

export default function Validation() {
  const { data: runs, isLoading } = useListValidationRuns();
  const { data: profiles } = useListCalibrationProfiles();
  const createRun = useCreateValidationRun();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      testType: "standard",
      totalCases: 1000
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createRun.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListValidationRunsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Validation run queued" });
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-mono text-[10px] tracking-wider uppercase">Completed</Badge>;
      case 'failed': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-mono text-[10px] tracking-wider uppercase">Failed</Badge>;
      case 'running': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px] tracking-wider uppercase animate-pulse">Running</Badge>;
      default: return <Badge variant="outline" className="font-mono text-[10px] uppercase">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
            <TestTube2 className="h-6 w-6" />
            Synthetic Validation
          </h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">Execute robustness tests against synthetic adversarial scenarios</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Play className="mr-2 h-4 w-4" />
              New Test Run
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-2">
                <TestTube2 className="h-4 w-4 text-primary" />
                Initialize Validation Run
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Run Identifier</FormLabel>
                    <FormControl><Input className="font-mono" placeholder="e.g. Adv-Lighting-001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="testType" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Test Scenario</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Scenario" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard" className="font-mono">Standard</SelectItem>
                          <SelectItem value="lighting-variation" className="font-mono">Lighting</SelectItem>
                          <SelectItem value="reflective-environment" className="font-mono">Reflective</SelectItem>
                          <SelectItem value="partial-occlusion" className="font-mono">Occlusion</SelectItem>
                          <SelectItem value="adversarial" className="font-mono">Adversarial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="totalCases" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Total Cases</FormLabel>
                      <FormControl><Input className="font-mono" type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="calibrationProfileId" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-mono">Target Calibration Profile</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Select profile" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {profiles?.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()} className="font-mono">{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono">Cancel</Button>
                  <Button type="submit" disabled={createRun.isPending} className="font-mono">Execute Run</Button>
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
                <TableHead className="font-mono text-xs font-semibold uppercase">Run ID</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Name / Scenario</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Cases (Pass/Total)</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Pass Rate</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Avg Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : runs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-mono text-sm border border-dashed border-border rounded-sm m-4">
                    No validation runs executed. Initialize a new test suite.
                  </TableCell>
                </TableRow>
              ) : runs?.map((run) => (
                <TableRow key={run.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-muted-foreground text-xs">#{run.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell>
                    <div className="font-medium font-mono text-sm">{run.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5 tracking-wider">{run.testType.replace('-', ' ')}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(run.status)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <span className="text-green-500 font-bold">{run.passedCases.toLocaleString()}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-muted-foreground">{run.totalCases.toLocaleString()}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`font-mono text-sm font-bold tracking-tight ${run.passRate < 80 ? 'text-destructive' : run.passRate < 95 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {run.passRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-primary">
                    {run.avgConfidenceScore ? `${(run.avgConfidenceScore * 100).toFixed(1)}%` : '-'}
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