import { useState } from "react";
import { useListCalibrationProfiles, useGetCalibrationDrift, useDeleteCalibrationProfile, useCreateCalibrationProfile, getListCalibrationProfilesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, AlertTriangle, Camera } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  cameraModel: z.string().min(1, "Camera model is required"),
  focalLengthPx: z.coerce.number().positive(),
  sensorWidthPx: z.coerce.number().positive(),
  sensorHeightPx: z.coerce.number().positive(),
  markerSizeMm: z.coerce.number().positive(),
  markerType: z.enum(["aruco", "virtual", "unknown"]),
  notes: z.string().optional()
});

export default function Calibration() {
  const { data: profiles, isLoading } = useListCalibrationProfiles();
  const { data: drift } = useGetCalibrationDrift();
  const deleteProfile = useDeleteCalibrationProfile();
  const createProfile = useCreateCalibrationProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cameraModel: "",
      focalLengthPx: 0,
      sensorWidthPx: 0,
      sensorHeightPx: 0,
      markerSizeMm: 0,
      markerType: "aruco",
      notes: ""
    }
  });

  const getDriftStatus = (id: number) => {
    return drift?.profiles.find(p => p.id === id);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this profile?")) {
      deleteProfile.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCalibrationProfilesQueryKey() });
          toast({ title: "Profile deleted" });
        }
      });
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createProfile.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCalibrationProfilesQueryKey() });
        setOpen(false);
        form.reset();
        toast({ title: "Profile created" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Calibration Profiles
          </h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">Manage camera intrinsic parameters and marker definitions</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="font-mono">
              <Plus className="mr-2 h-4 w-4" />
              New Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-mono">Create Calibration Profile</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Profile Name</FormLabel>
                      <FormControl><Input className="font-mono" placeholder="e.g. iPhone 13 Pro Main" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cameraModel" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Camera Model</FormLabel>
                      <FormControl><Input className="font-mono" placeholder="e.g. Apple iPhone 13 Pro" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="focalLengthPx" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Focal Length (px)</FormLabel>
                      <FormControl><Input className="font-mono" type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="markerSizeMm" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Marker Size (mm)</FormLabel>
                      <FormControl><Input className="font-mono" type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sensorWidthPx" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Sensor Width (px)</FormLabel>
                      <FormControl><Input className="font-mono" type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sensorHeightPx" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-mono">Sensor Height (px)</FormLabel>
                      <FormControl><Input className="font-mono" type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="markerType" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="font-mono">Marker Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono"><SelectValue placeholder="Select type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aruco" className="font-mono">Aruco</SelectItem>
                          <SelectItem value="virtual" className="font-mono">Virtual</SelectItem>
                          <SelectItem value="unknown" className="font-mono">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono">Cancel</Button>
                  <Button type="submit" disabled={createProfile.isPending} className="font-mono">Save Profile</Button>
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
                <TableHead className="font-mono text-xs font-semibold uppercase">Profile Name</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Camera Model</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Focal Length</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase text-right">Sensor Size</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Marker Type</TableHead>
                <TableHead className="font-mono text-xs font-semibold uppercase">Drift Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ) : profiles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-mono text-sm border-dashed border-border border rounded-sm m-4">
                    No calibration profiles found. Register a new intrinsic profile.
                  </TableCell>
                </TableRow>
              ) : profiles?.map((profile) => {
                const status = getDriftStatus(profile.id);
                return (
                  <TableRow key={profile.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium font-mono text-sm">{profile.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{profile.cameraModel}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-primary">{profile.focalLengthPx}px</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{profile.sensorWidthPx}×{profile.sensorHeightPx}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase bg-secondary/50">{profile.markerType}</Badge>
                    </TableCell>
                    <TableCell>
                      {status?.driftDetected ? (
                        <div className="flex items-center gap-2 text-destructive font-mono text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{status.driftMagnitude}% DRIFT</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground font-mono text-xs">NOMINAL</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(profile.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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