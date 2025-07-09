import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet, // Import Outlet để xử lý route lồng nhau
  useLocation,
} from "react-router-dom";
import { BlogProvider, useBlog } from "@/contexts/BlogContext";
import { Loader2 } from "lucide-react"; // Import icon loading

// Import các trang
import Index from "./pages/Index";
import Write from "./pages/Write";
import Posts from "./pages/Posts";
import PostDetail from "./pages/PostDetail";
import Categories from "./pages/Categories";
import CategoryPosts from "./pages/CategoryPosts";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

/**
 * Component Layout được bảo vệ
 * - Component này sẽ kiểm tra trạng thái đăng nhập.
 * - Nếu đang kiểm tra: Hiển thị màn hình loading.
 * - Nếu chưa đăng nhập: Chuyển hướng người dùng đến trang /login.
 * - Nếu đã đăng nhập: Hiển thị các trang con (thông qua <Outlet />).
 */
const ProtectedLayout = () => {
  const { user, isAuthLoading } = useBlog();
  const location = useLocation();

  // Trong khi Firebase đang kiểm tra trạng thái đăng nhập, hiển thị loading
  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // Nếu không có người dùng, chuyển hướng đến trang đăng nhập
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu đã đăng nhập, cho phép truy cập các route con
  return <Outlet />;
};

/**
 * Cấu trúc các Routes của ứng dụng
 * - Route /login là public.
 * - Tất cả các route khác được đặt bên trong <ProtectedLayout /> để yêu cầu đăng nhập.
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Route công khai, ai cũng có thể truy cập */}
      <Route path="/login" element={<Login />} />

      {/* Các route riêng tư, yêu cầu đăng nhập */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/write" element={<Write />} />
        <Route path="/edit/:id" element={<Write />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/category/:category" element={<CategoryPosts />} />
      </Route>

      {/* Route bắt lỗi 404 cho các đường dẫn không tồn tại */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

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
