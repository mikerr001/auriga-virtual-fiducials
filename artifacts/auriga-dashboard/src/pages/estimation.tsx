import { useState } from "react";
import { useListEstimationResults, useRunEstimation, useListCalibrationProfiles, useListDatasets, getListEstimationResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ruler, Play, Crosshair } from "lucide-react";
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
  calibrationProfileId: z.coerce.number().positive("Select a calibration profile"),
  datasetId: z.coerce.number().optional().or(z.literal(0)),
  method: z.enum(["pinhole", "perspective-n-point", "homography"]),
  markerPixelWidth: z.coerce.number().positive(),
  markerPixelHeight: z.coerce.number().optional(),
  measuredDistanceM: z.coerce.number().optional(),
  lightingCondition: z.enum(["normal", "low-light", "bright", "reflective"]).optional(),
  partialOcclusion: z.boolean().default(false),
  notes: z.string().optional()
});

export default function Estimation() {
  const { data: results, isLoading } = useListEstimationResults();
  const { data: profiles } = useListCalibrationProfiles();
  const { data: datasets } = useListDatasets();
  const runEstimation = useRunEstimation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calibrationProfileId: undefined,
      method: "pinhole",
      markerPixelWidth: 100,
      partialOcclusion: false
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const data = {
      ...values,
      datasetId: values.datasetId || undefined,
    };
    
    runEstimation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEstimationResultsQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Estimation execution complete" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
            <Ruler className="h-6 w-6" />
            Distance Estimation
          </h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">Execute monocular distance estimations and analyze confidence intervals</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Play className="mr-2 h-4 w-4" />
              Run Estimation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="font-mono flex items-center gap-2">
                <Crosshair className="h-4 w-4 text-primary" />
                Configure Estimation Parameters
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="calibrationProfileId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Calibration Profile</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Select profile" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {profiles?.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()} className="font-mono">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="method" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Solver Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Select method" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pinhole" className="font-mono">Pinhole</SelectItem>
                          <SelectItem value="perspective-n-point" className="font-mono">Perspective-N-Point</SelectItem>
                          <SelectItem value="homography" className="font-mono">Homography</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="markerPixelWidth" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Marker Pixel Width</FormLabel>
                      <FormControl><Input className="font-mono" type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="measuredDistanceM" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono text-muted-foreground">Ground Truth (Optional, m)</FormLabel>
                      <FormControl><Input className="font-mono" type="number" step="0.001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="datasetId" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-mono text-muted-foreground">Source Dataset (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="None" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" className="font-mono">None</SelectItem>
                          {datasets?.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()} className="font-mono">
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono">Cancel</Button>
                  <Button type="submit" disabled={runEstimation.isPending} className="font-mono">Execute</Button>
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
                <TableHead className="font-mono text-xs font-semibold uppercase">ID</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Method</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Ground Truth</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Estimated</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Abs Error</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Confidence Band</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Lighting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : results?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-mono text-sm border-dashed border border-border m-4 rounded-sm">
                    No estimation results found. Run an estimation to generate data.
                  </TableCell>
                </TableRow>
              ) : results?.map((result) => {
                const error = result.measuredDistanceM 
                  ? Math.abs(result.estimatedDistanceM - result.measuredDistanceM) 
                  : null;
                  
                return (
                  <TableRow key={result.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-muted-foreground text-xs">#{result.id.toString().padStart(4, '0')}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {result.method === 'perspective-n-point' ? 'PnP' : result.method === 'homography' ? 'HMG' : 'PIN'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {result.measuredDistanceM ? `${result.measuredDistanceM.toFixed(3)}m` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary text-sm">
                      {result.estimatedDistanceM.toFixed(3)}m
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {error !== null ? (
                        <span className={error > 0.1 ? "text-destructive" : "text-green-500"}>
                          {error.toFixed(3)}m
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${result.confidenceScore > 0.8 ? 'bg-green-500' : result.confidenceScore > 0.5 ? 'bg-yellow-500' : 'bg-destructive'}`}
                            style={{ width: `${result.confidenceScore * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground w-8">
                          {(result.confidenceScore * 100).toFixed(0)}%
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground opacity-50">
                          ±{result.uncertaintyM.toFixed(2)}m
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.lightingCondition ? (
                        <Badge variant="outline" className="font-mono text-[10px] uppercase bg-secondary/50">
                          {result.lightingCondition.replace('-', ' ')}
                        </Badge>
                      ) : <span className="font-mono text-xs text-muted-foreground">STD</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}