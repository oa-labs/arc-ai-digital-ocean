import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { Login } from '@/pages/Login';
import { Analytics } from '@/pages/Analytics';
import { Files } from '@/pages/Files';
import { Agents } from '@/pages/Agents';
import { AgentEdit } from '@/pages/AgentEdit';
import { BucketDetail } from '@/pages/BucketDetail';
import { Users } from '@/pages/Users';
import { Settings } from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <Files />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agents"
              element={
                <AdminRoute>
                  <Agents />
                </AdminRoute>
              }
            />
            <Route
              path="/agents/:agentId"
              element={
                <AdminRoute>
                  <AgentEdit />
                </AdminRoute>
              }
            />
            <Route
              path="/buckets/:bucketName"
              element={
                <ProtectedRoute>
                  <BucketDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

