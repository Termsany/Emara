import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/project-detail";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/client-detail";
import QuotationsPage from "@/pages/quotations";
import ApprovalsPage from "@/pages/approvals";
import PaymentsPage from "@/pages/payments";
import BoqPage from "@/pages/boq";
import FilesPage from "@/pages/files";
import UsersPage from "@/pages/users";
import SettingsPage from "@/pages/settings";
import PortalDashboardPage from "@/pages/portal/dashboard";
import PortalProjectViewPage from "@/pages/portal/project-view";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={DashboardPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id" component={ProjectDetailPage} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/clients/:id" component={ClientDetailPage} />
      <Route path="/quotations" component={QuotationsPage} />
      <Route path="/approvals" component={ApprovalsPage} />
      <Route path="/payments" component={PaymentsPage} />
      <Route path="/boq" component={BoqPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/users" component={UsersPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/portal" component={PortalDashboardPage} />
      <Route path="/portal/projects/:id" component={PortalProjectViewPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={base}>
          <Router />
        </WouterRouter>
        <Toaster position="top-center" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
