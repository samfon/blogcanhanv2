import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { BlogHeader } from "@/components/blog/BlogHeader";
import { Button } from "@/components/ui/button";
import { HomeIcon, SearchIcon } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />
      <div className="container mx-auto max-w-7xl px-4 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md">
          <div className="text-6xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-bold mb-4">Trang không tồn tại</h1>
          <p className="text-muted-foreground mb-8">
            Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm. Trang
            có thể đã được di chuyển hoặc không còn tồn tại.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Button asChild>
              <Link to="/" className="flex items-center space-x-2">
                <HomeIcon className="h-4 w-4" />
                <span>Về trang chủ</span>
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/search" className="flex items-center space-x-2">
                <SearchIcon className="h-4 w-4" />
                <span>Tìm kiếm</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
