import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { setupApi } from '../api/endpoints';
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
import { ReviewPage } from '../pages/ReviewPage';
import { ValidationPage } from '../pages/ValidationPage';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../context/AuthContext';

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
        <Route path="/ideas/:id/validation" element={<ValidationPage />} />
        <Route path="/innovation" element={<InnovationsPage />} />
        <Route path="/innovation/:id" element={<InnovationDetailPage />} />
        <Route path="/innovation/:innovationId" element={<InnovationDetailPage />} />
        <Route path="/workspace" element={<MyWorkspacePage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/administration" element={<AdministrationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['setup-status'],
    queryFn: setupApi.getStatus,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-enterprise-gray-warm">
        <div className="text-enterprise-charcoal-800 text-lg">Loading INNOVEX...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {status?.setup_required ? (
        <Routes>
          <Route path="*" element={<SetupPage onSetupComplete={() => refetch()} />} />
        </Routes>
      ) : (
        <AppRoutes />
      )}
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
