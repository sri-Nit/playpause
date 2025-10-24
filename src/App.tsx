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
import ProfilePage from "./pages/Profile";
import SignUp from "./pages/SignUp";
import WatchVideo from "./pages/WatchVideo"; // Import the new WatchVideo page
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
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/watch/:id" element={<WatchVideo />} /> {/* Add the new watch video route */}
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