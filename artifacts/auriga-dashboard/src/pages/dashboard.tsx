import { useGetEvaluationSummary, useGetCalibrationDrift, useListResearchDebt, useListEstimationResults } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, AlertCircle, BarChart, ActivitySquare, Target } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetEvaluationSummary();
  const { data: drift, isLoading: isLoadingDrift } = useGetCalibrationDrift();
  const { data: debt, isLoading: isLoadingDebt } = useListResearchDebt();
  const { data: results, isLoading: isLoadingResults } = useListEstimationResults();

  const criticalDebt = debt?.filter(d => d.severity === 'critical') || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight text-primary flex items-center gap-2">
          <ActivitySquare className="h-8 w-8" />
          Engine Overview
        </h1>
        <p className="text-muted-foreground font-mono mt-1">System status, evaluation summary, and telemetry</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">Total Evaluations</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-3xl font-bold font-mono text-foreground tracking-tight">{summary?.totalReports || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider font-mono text-muted-foreground">Global Avg MAE</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-3xl font-bold font-mono text-primary tracking-tight">{(summary?.avgMae || 0).toFixed(4)}m</div>
            )}
          </CardContent>
        </Card>

        <Card className={drift?.driftDetectedCount ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card/50'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-xs font-bold uppercase tracking-wider font-mono ${drift?.driftDetectedCount ? 'text-destructive' : 'text-muted-foreground'}`}>
              Calibration Drift
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${drift?.driftDetectedCount ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {isLoadingDrift ? <Skeleton className="h-8 w-16" /> : (
              <div className={`text-3xl font-bold font-mono tracking-tight ${drift?.driftDetectedCount ? 'text-destructive' : 'text-foreground'}`}>
                {drift?.driftDetectedCount || 0} <span className="text-lg font-normal text-muted-foreground">/ {drift?.totalProfiles || 0}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={criticalDebt.length > 0 ? 'border-orange-500/50 bg-orange-500/5' : 'border-border bg-card/50'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-xs font-bold uppercase tracking-wider font-mono ${criticalDebt.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
              Critical Debt
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${criticalDebt.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {isLoadingDebt ? <Skeleton className="h-8 w-16" /> : (
              <div className={`text-3xl font-bold font-mono tracking-tight ${criticalDebt.length > 0 ? 'text-orange-500' : 'text-foreground'}`}>{criticalDebt.length}</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Recent Estimations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10 hidden md:table-header-group">
                <TableRow>
                  <TableHead className="font-mono text-[10px] uppercase">ID</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-right">Error</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase text-right">Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingResults ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4"><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                ) : results?.slice(0, 5).map(res => {
                  const error = res.measuredDistanceM ? Math.abs(res.estimatedDistanceM - res.measuredDistanceM) : null;
                  return (
                    <TableRow key={res.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-xs text-muted-foreground py-2">#{res.id.toString().padStart(4, '0')}</TableCell>
                      <TableCell className="text-right font-mono text-xs py-2">
                        {error !== null ? (
                          <span className={error > 0.1 ? 'text-destructive' : 'text-green-500'}>{error.toFixed(3)}m</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-primary py-2">{(res.confidenceScore * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="border-b border-border/50 pb-4 bg-muted/20">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Active Critical Research Debt
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {isLoadingDebt ? (
                  <TableRow><TableCell className="text-center py-4"><Skeleton className="h-4 w-full" /></TableCell></TableRow>
                ) : criticalDebt.length === 0 ? (
                  <TableRow>
                    <TableCell className="text-center py-8 text-muted-foreground font-mono text-xs">
                      No critical issues logged.
                    </TableCell>
                  </TableRow>
                ) : criticalDebt.slice(0, 5).map(issue => (
                  <TableRow key={issue.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <div className="font-mono text-xs font-semibold mb-1 text-foreground">{issue.title}</div>
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-wider bg-orange-500/10 text-orange-500 border-orange-500/20 px-1 py-0">{issue.severity}</Badge>
                        <span className="font-mono text-[9px] uppercase text-muted-foreground">{issue.category.replace('-', ' ')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}