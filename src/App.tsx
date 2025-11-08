import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UploadVideo from "./pages/UploadVideo";
import Layout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import YouPage from "./pages/You";
import SignUp from "./pages/SignUp";
import WatchVideo from "./pages/WatchVideo";
import SearchResults from "./pages/SearchResults";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorProfilePage from "./pages/CreatorProfilePage";
import { SessionContextProvider } from "./components/SessionContextProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/upload" element={<UploadVideo />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/you" element={<YouPage />} />
              <Route path="/watch/:id" element={<WatchVideo />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/dashboard" element={<CreatorDashboard />} />
              <Route path="/profile/:id" element={<CreatorProfilePage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;