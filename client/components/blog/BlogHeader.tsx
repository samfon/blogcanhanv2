import { Button } from "@/components/ui/button";
import { BookOpenIcon, LogOutIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useBlog } from "@/contexts/BlogContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BlogHeader() {
  const { user, logout, isAuthLoading } = useBlog();

  const renderAuthButton = () => {
    if (isAuthLoading) {
      return <Button variant="ghost" size="sm" disabled>Đang tải...</Button>;
    }
    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem onClick={logout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
      // Sửa: Chuyển nút đăng nhập thành Link đến trang /login
      <Button asChild variant="outline" size="sm">
        <Link to="/login">Đăng nhập</Link>
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto max-w-7xl px-4 flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpenIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Qúi Tiến Library
            </span>
          </Link>
          {/* Chỉ hiển thị nav nếu đã đăng nhập */}
          {user && (
            <nav className="hidden md:flex items-center space-x-1">
                <Button asChild variant="ghost" size="sm"><Link to="/">Trang chủ</Link></Button>
                <Button asChild variant="ghost" size="sm"><Link to="/categories">Danh mục</Link></Button>
                <Button asChild variant="ghost" size="sm"><Link to="/posts">Bài viết</Link></Button>
                <Button asChild variant="ghost" size="sm"><Link to="/write">Viết bài</Link></Button>
            </nav>
          )}
        </div>
        <div className="flex items-center space-x-2">
            {renderAuthButton()}
        </div>
      </div>
    </header>
  );
}
