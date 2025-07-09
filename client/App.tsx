import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BlogProvider } from "@/contexts/BlogContext";
import Index from "./pages/Index";
import Write from "./pages/Write";
import Posts from "./pages/Posts";
import PostDetail from "./pages/PostDetail";
import Categories from "./pages/Categories";
import CategoryPosts from "./pages/CategoryPosts";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Đã có lỗi xảy ra</h2>
        <p className="text-muted-foreground mb-4">
          Xin lỗi, ứng dụng gặp lỗi không mong muốn.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Tải lại trang
        </button>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BlogProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/write" element={<Write />} />
              <Route path="/posts" element={<Posts />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/edit/:id" element={<Write />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/category/:category" element={<CategoryPosts />} />
              <Route
                path="/search"
                element={
                  <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold mb-4">Tìm kiếm</h1>
                      <p className="text-muted-foreground">
                        Trang này sẽ được phát triển sau.
                      </p>
                    </div>
                  </div>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BlogProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
