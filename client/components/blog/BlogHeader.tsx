import { Button } from "@/components/ui/button";
import { PenIcon, BookOpenIcon, SearchIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function BlogHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpenIcon className="h-5 w-5 text-primary" />
            </div>
            {/* Đã thay đổi tên ở đây */}
            <span className="text-xl font-bold text-foreground">
              Qúi Tiến Library
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            <Button
              asChild
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/">Trang chủ</Link>
            </Button>
            <Button
              asChild
              variant={
                location.pathname === "/categories" ||
                location.pathname.startsWith("/category/")
                  ? "default"
                  : "ghost"
              }
              size="sm"
            >
              <Link to="/categories">Danh mục</Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === "/posts" ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/posts">Bài viết</Link>
            </Button>
            <Button
              asChild
              variant={location.pathname === "/write" ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/write">Viết bài</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
