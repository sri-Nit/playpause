import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UploadVideo from "./pages/UploadVideo";
import Layout from "./components/Layout";
import { ThemeProvider } from "./components/ThemeProvider";
import LoginPage from "./pages/Login"; // Import the new Login page
import ProfilePage from "./pages/Profile"; // Import the new Profile page
import { SessionContextProvider } from "./components/SessionContextProvider"; // Import SessionContextProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme" attribute="class">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SessionContextProvider> {/* Wrap the entire app with SessionContextProvider */}
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/upload" element={<UploadVideo />} />
                <Route path="/login" element={<LoginPage />} /> {/* Add Login route */}
                <Route path="/profile" element={<ProfilePage />} /> {/* Add Profile route */}
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </SessionContextProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;