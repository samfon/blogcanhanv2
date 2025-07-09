import { useState } from "react";
import { db } from "@/firebaseConfig";
import { collection, writeBatch, doc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";

// Dữ liệu mẫu giống như trong phiên bản localStorage cũ
const initialPostsData = [
    {
      id: "1",
      title: "Hướng dẫn sử dụng React Hooks hiệu quả",
      content: `<h1>React Hooks - Hướng dẫn chi tiết</h1><p>React Hooks đã thay đổi cách chúng ta viết React components...</p><h2>useState Hook</h2><p><code>useState</code> là hook cơ bản nhất để quản lý state...</p>`,
      excerpt: "Tìm hiểu cách sử dụng useState, useEffect và các hooks khác trong React để xây dựng ứng dụng mạnh mẽ.",
      category: "React",
      publishedAt: "15/12/2024",
      updatedAt: "20/12/2024",
      status: "published",
      views: 142,
      readTime: "8 phút đọc",
      updateLogs: [ { id: "1", date: "20/12/2024", version: "1.1", changes: ["Thêm ví dụ về custom hooks", "Sửa lỗi typo"], note: "Cập nhật thêm examples thực tế" } ],
    },
    {
      id: "2",
      title: "TypeScript Best Practices trong dự án lớn",
      content: `<h1>TypeScript Best Practices</h1><p>Khi làm việc với TypeScript trong dự án lớn...</p>`,
      excerpt: "Khám phá các kỹ thuật và best practices để cải thiện tốc độ biên dịch và hiệu suất runtime.",
      category: "TypeScript",
      publishedAt: "10/12/2024",
      updatedAt: "18/12/2024",
      status: "published",
      views: 89,
      readTime: "12 phút đọc",
      updateLogs: [],
    },
    {
      id: "3",
      title: "Design System với TailwindCSS",
      content: `<h1>Design System với TailwindCSS</h1><p>Xây dựng design system nhất quán...</p>`,
      excerpt: "Xây dựng một design system nhất quán và có thể tái sử dụng bằng TailwindCSS.",
      category: "CSS",
      publishedAt: "05/12/2024",
      updatedAt: "05/12/2024",
      status: "published",
      views: 56,
      readTime: "10 phút đọc",
      updateLogs: [],
    },
];

const initialCategoriesData = [
  { id: "react", name: "React", description: "Thư viện JavaScript phổ biến để xây dựng user interface", postCount: 1 },
  { id: "typescript", name: "TypeScript", description: "Ngôn ngữ lập trình mạnh với type system cho JavaScript", postCount: 1 },
  { id: "css", name: "CSS", description: "Styling và thiết kế giao diện web hiện đại", postCount: 1 },
];

type Status = "idle" | "migrating" | "success" | "error";

export default function MigrateData() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleMigrate = async () => {
    setStatus("migrating");
    setMessage("Đang chuẩn bị di chuyển dữ liệu...");

    try {
      // Dùng writeBatch để thực hiện nhiều thao tác ghi cùng lúc, an toàn và hiệu quả hơn
      const batch = writeBatch(db);

      // Di chuyển danh mục
      setMessage("Đang di chuyển danh mục...");
      initialCategoriesData.forEach(category => {
        const categoryRef = doc(db, "categories", category.id);
        batch.set(categoryRef, category);
      });

      // Di chuyển bài viết
      setMessage("Đang di chuyển bài viết...");
      initialPostsData.forEach(post => {
        // Chuyển đổi ngày tháng từ string sang Timestamp của Firebase
        const [dayP, monthP, yearP] = post.publishedAt.split('/').map(Number);
        const [dayU, monthU, yearU] = post.updatedAt.split('/').map(Number);
        
        const postForFirebase = {
          ...post,
          id: undefined, // Firestore sẽ tự tạo ID
          publishedAt: Timestamp.fromDate(new Date(yearP, monthP - 1, dayP)),
          updatedAt: Timestamp.fromDate(new Date(yearU, monthU - 1, dayU)),
        };
        delete postForFirebase.id; 

        const postRef = doc(collection(db, "posts"));
        batch.set(postRef, postForFirebase);
      });

      // Thực thi tất cả các thao tác ghi
      await batch.commit();

      setStatus("success");
      setMessage(`Di chuyển thành công ${initialCategoriesData.length} danh mục và ${initialPostsData.length} bài viết!`);

    } catch (error) {
      console.error("Migration error:", error);
      setStatus("error");
      setMessage(`Có lỗi xảy ra: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "migrating": return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case "success": return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "error": return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default: return <UploadCloud className="h-8 w-8 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Di Chuyển Dữ Liệu Lên Firestore</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="flex justify-center">{getStatusIcon()}</div>
          <p className="text-muted-foreground">
            {status === 'idle' 
              ? "Nhấn nút bên dưới để đẩy dữ liệu mẫu ban đầu lên cơ sở dữ liệu Firestore. Thao tác này chỉ cần thực hiện một lần duy nhất." 
              : message}
          </p>
          <Button onClick={handleMigrate} disabled={status === "migrating" || status === "success"} size="lg">
            {status === "migrating" ? "Đang di chuyển..." : "Bắt đầu di chuyển"}
          </Button>
          {status === 'success' && (
            <Button asChild variant="outline">
              <Link to="/">Về trang chủ</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
