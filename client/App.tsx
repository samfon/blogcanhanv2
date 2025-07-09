import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BlogProvider, useBlog } from "@/contexts/BlogContext";
import Index from "./pages/Index";
import Write from "./pages/Write";
import Posts from "./pages/Posts";
import PostDetail from "./pages/PostDetail";
import Categories from "./pages/Categories";
import CategoryPosts from "./pages/CategoryPosts";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // Import trang Login

// Component để bảo vệ các route cần đăng nhập
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthLoading } = useBlog();

  if (isAuthLoading) {
    return <div>Đang tải...</div>; // Hoặc một spinner toàn trang
  }

  if (!user) {
    // Nếu chưa đăng nhập, chuyển hướng đến trang Login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            
            {/* Các route cần bảo vệ */}
            <Route path="/write" element={<ProtectedRoute><Write /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute><Write /></ProtectedRoute>} />

            {/* Các route công khai */}
            <Route path="/posts" element={<Posts />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/category/:category" element={<CategoryPosts />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

const App = () => (
  <QueryClientProvider client={new QueryClient()}>
    <BlogProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </BlogProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
