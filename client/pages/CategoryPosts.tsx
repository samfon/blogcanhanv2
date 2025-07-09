import { BlogHeader } from "@/components/blog/BlogHeader";
import { CategoryEditModal } from "@/components/blog/CategoryEditModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBlog } from "@/contexts/BlogContext";
import {
  SearchIcon,
  ArrowLeftIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
  EditIcon,
  SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function CategoryPosts() {
  const { category } = useParams();
  const { getPostsByCategory, incrementViews, categories, updateCategory } =
    useBlog();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get category info
  const categoryInfo = categories.find(
    (cat) =>
      cat.id === category || cat.name.toLowerCase() === category?.toLowerCase(),
  );

  // Filter posts by category using the context function
  const categoryPosts = category ? getPostsByCategory(category) : [];

  // Filter by search query
  const filteredPosts = categoryPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const categoryName = categoryInfo?.name || category || "Không xác định";

  return (
    <div className="min-h-screen bg-background">
      <BlogHeader />

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Quay lại trang chủ</span>
          </Link>
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Danh mục: {categoryName}
              </h1>
              <p className="text-muted-foreground">
                {categoryInfo?.description ||
                  `Tất cả bài viết thuộc danh mục ${categoryName}`}
              </p>
            </div>
            {categoryInfo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center space-x-2"
              >
                <SettingsIcon className="h-4 w-4" />
                <span>Chỉnh sửa danh mục</span>
              </Button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Tìm thấy {filteredPosts.length} bài viết
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm trong danh mục này..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <Card>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/20 text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Tiêu đề</div>
              <div className="col-span-2">Tags</div>
              <div className="col-span-2">Ngày tạo</div>
              <div className="col-span-2">Lượt xem</div>
              <div className="col-span-2">Thao tác</div>
            </div>

            {/* Posts */}
            {filteredPosts.map((post, index) => (
              <div
                key={`category-post-${post.id}-${index}`}
                className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/10 transition-colors"
              >
                <div className="col-span-4">
                  <div
                    className="font-medium hover:text-primary cursor-pointer transition-colors"
                    onClick={() => {
                      incrementViews(post.id);
                      navigate(`/post/${post.id}`);
                    }}
                  >
                    {post.title}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex gap-1 flex-wrap">
                    {post.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={`${post.id}-tag-${idx}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/20 text-primary border border-primary/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{post.publishedAt}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <EyeIcon className="h-3 w-3" />
                    <span>{post.views}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        incrementViews(post.id);
                        navigate(`/post/${post.id}`);
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/edit/${post.id}`)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchQuery
                ? `Không tìm thấy bài viết nào với từ khóa "${searchQuery}"`
                : `Chưa có bài viết nào trong danh mục "${categoryName}"`}
            </div>
            <Button onClick={() => navigate("/write")}>
              Tạo bài viết đầu tiên
            </Button>
          </div>
        )}

        {/* Category Edit Modal */}
        {categoryInfo && (
          <CategoryEditModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            category={categoryInfo}
            onSave={(name, description) => {
              updateCategory(categoryInfo.id, name, description);
            }}
          />
        )}
      </main>
    </div>
  );
}
