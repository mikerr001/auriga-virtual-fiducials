import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Calibration from "@/pages/calibration";
import Estimation from "@/pages/estimation";
import Datasets from "@/pages/datasets";
import Evaluation from "@/pages/evaluation";
import ResearchDebt from "@/pages/research-debt";
import Validation from "@/pages/validation";
import Layout from "@/components/layout";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/calibration" component={() => <Layout><Calibration /></Layout>} />
      <Route path="/estimation" component={() => <Layout><Estimation /></Layout>} />
      <Route path="/datasets" component={() => <Layout><Datasets /></Layout>} />
      <Route path="/evaluation" component={() => <Layout><Evaluation /></Layout>} />
      <Route path="/research-debt" component={() => <Layout><ResearchDebt /></Layout>} />
      <Route path="/validation" component={() => <Layout><Validation /></Layout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
