import { useState } from "react";
import { useListEvaluationReports, useCreateEvaluationReport, useListDatasets, useListCalibrationProfiles, getListEvaluationReportsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Play, AlertTriangle, BarChart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  datasetId: z.coerce.number().positive("Dataset required"),
  calibrationProfileId: z.coerce.number().positive("Calibration profile required")
});

export default function Evaluation() {
  const { data: reports, isLoading } = useListEvaluationReports();
  const { data: datasets } = useListDatasets();
  const { data: profiles } = useListCalibrationProfiles();
  const createReport = useCreateEvaluationReport();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createReport.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEvaluationReportsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Evaluation complete" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
            <BarChart className="h-6 w-6" />
            Evaluation Reports
          </h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">Systematic accuracy analysis across datasets</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Play className="mr-2 h-4 w-4" />
              Run Evaluation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="font-mono">Configure Evaluation</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="datasetId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Target Dataset</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="font-mono"><SelectValue placeholder="Select dataset" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {datasets?.map(d => (
                          <SelectItem key={d.id} value={d.id.toString()} className="font-mono">{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="calibrationProfileId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-mono">Calibration Profile</FormLabel>
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
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono">Cancel</Button>
                  <Button type="submit" disabled={createReport.isPending} className="font-mono">Execute</Button>
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
                <TableHead className="font-mono text-xs font-semibold uppercase">Report ID</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Config</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Samples Evaluated</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">MAE</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">RMSE</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">MAPE</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Drift Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : reports?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-mono text-sm border-dashed border border-border m-4 rounded-sm">
                    No evaluation reports available. Run an evaluation.
                  </TableCell>
                </TableRow>
              ) : reports?.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-medium text-xs text-muted-foreground">#{report.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell className="font-mono text-sm">
                    <span className="text-primary">D:{report.datasetId}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-secondary-foreground">P:{report.calibrationProfileId}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{report.sampleCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-primary font-bold text-sm">{report.mae.toFixed(4)}m</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground text-sm">{report.rmse.toFixed(4)}m</TableCell>
                  <TableCell className="text-right font-mono text-sm">{report.mape.toFixed(2)}%</TableCell>
                  <TableCell>
                    {report.driftDetected ? (
                      <div className="flex items-center gap-1.5 text-destructive bg-destructive/10 px-2 py-0.5 rounded w-fit">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-mono text-[10px] font-bold">{report.driftMagnitude}%</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground font-mono text-[10px] uppercase px-2">Nominal</span>
                    )}
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