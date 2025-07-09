import { useBlog } from "@/contexts/BlogContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogInIcon } from "lucide-react";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { login, user, isAuthLoading } = useBlog();

  if (isAuthLoading) {
    return <div>Đang kiểm tra...</div>; // Hoặc một spinner đẹp hơn
  }

  // Nếu đã đăng nhập, tự động chuyển về trang chủ
  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Chào mừng trở lại!</CardTitle>
          <CardDescription>Vui lòng đăng nhập để tiếp tục</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={login} className="w-full" size="lg">
            <LogInIcon className="mr-2 h-4 w-4" />
            Đăng nhập bằng Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
