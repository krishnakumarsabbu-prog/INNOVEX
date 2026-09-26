import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { setupApi } from '../api/endpoints';
import type { SetupStatus } from '../types';
import { AppLayout } from '../layouts/AppLayout';
import { SetupPage } from '../pages/SetupPage';
import { HomePage } from '../pages/HomePage';
import { IdeasPage } from '../pages/IdeasPage';
import { IdeaDetailPage } from '../pages/IdeaDetailPage';
import { NewIdeaPage } from '../pages/NewIdeaPage';
import { MyIdeasPage } from '../pages/MyIdeasPage';
import { InnovationsPage } from '../pages/InnovationsPage';
import { InnovationDetailPage } from '../pages/InnovationDetailPage';
import { MyWorkspacePage } from '../pages/MyWorkspacePage';
import { TeamsPage } from '../pages/TeamsPage';
import { ProjectsPage } from '../pages/ProjectsPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { InsightsPage } from '../pages/InsightsPage';
import { AdministrationPage } from '../pages/AdministrationPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/ideas/new" element={<NewIdeaPage />} />
        <Route path="/ideas/mine" element={<MyIdeasPage />} />
        <Route path="/ideas/:id" element={<IdeaDetailPage />} />
        <Route path="/innovations" element={<InnovationsPage />} />
        <Route path="/innovations/:id" element={<InnovationDetailPage />} />
        <Route path="/workspace" element={<MyWorkspacePage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/administration" element={<AdministrationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupApi.getStatus()
      .then(setSetupStatus)
      .catch(() => setSetupStatus({ setup_required: true, organization: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-enterprise-gray-warm">
        <div className="text-enterprise-charcoal text-lg">Loading INNOVEX...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {setupStatus?.setup_required ? (
          <Routes>
            <Route path="*" element={<SetupPage />} />
          </Routes>
        ) : (
          <AppRoutes />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  );
}
