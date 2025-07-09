import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { mergeCategories } from "@/utils/cleanupCategories";
import { format } from "date-fns";
import Fuse from 'fuse.js';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  status: "draft" | "published";
  views: number;
  readTime: string;
  updateLogs: UpdateLog[];
  lastViewedAt?: number;
}

export interface UpdateLog {
  id: string;
  date: string;
  version: string;
  changes: string[];
  note?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  postCount: number;
  recentPosts: string[];
}

interface BlogContextType {
  posts: Post[];
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  createPost: (
    post: Omit<
      Post,
      "id" | "publishedAt" | "updatedAt" | "views" | "updateLogs"
    >,
  ) => void;
  updatePost: (id: string, post: Partial<Post>) => void;
  deletePost: (id: string) => void;
  getPost: (id: string) => Post | undefined;
  searchPosts: (query: string) => Post[];
  getPostsByCategory: (category: string) => Post[];
  incrementViews: (id: string) => void;
  updateCategory: (id: string, name: string, description: string) => void;
  createCategory: (name: string, description: string) => void;
  isLoading: boolean;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlog must be used within a BlogProvider");
  }
  return context;
}

// Sample data
const initialPosts: Post[] = [
  {
    id: "1",
    title: "Hướng dẫn sử dụng React Hooks hiệu quả",
    content: `# React Hooks - Hướng dẫn chi tiết

React Hooks đã thay đổi cách chúng ta viết React components...

## useState Hook

\`useState\` là hook cơ bản nhất để quản lý state...`,
    excerpt:
      "Tìm hiểu cách sử dụng useState, useEffect và các hooks khác trong React để xây dựng ứng dụng mạnh mẽ.",
    category: "React",
    publishedAt: "15/12/2024",
    updatedAt: "20/12/2024",
    status: "published",
    views: 142,
    readTime: "8 phút đọc",
    updateLogs: [
      {
        id: "1",
        date: "20/12/2024",
        version: "1.1",
        changes: ["Thêm ví dụ về custom hooks", "Sửa lỗi typo"],
        note: "Cập nhật thêm examples thực tế",
      },
    ],
  },
  {
    id: "2",
    title: "TypeScript Best Practices trong dự án lớn",
    content: `# TypeScript Best Practices

Khi làm việc với TypeScript trong dự án lớn...`,
    excerpt:
      "Khám phá các kỹ thuật và best practices để cải thiện tốc độ biên dịch và hiệu suất runtime.",
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
    content: `# Design System với TailwindCSS

Xây dựng design system nhất quán...`,
    excerpt:
      "Xây dựng một design system nhất quán và có thể tái sử dụng bằng TailwindCSS.",
    category: "CSS",
    publishedAt: "5/12/2024",
    updatedAt: "5/12/2024",
    status: "published",
    views: 56,
    readTime: "10 phút đọc",
    updateLogs: [],
  },
  {
    id: "4",
    title: "React Context API - Quản lý state toàn cục",
    content: `# React Context API

Context API là giải pháp tuyệt vời để quản lý state toàn cục trong React...`,
    excerpt:
      "Học cách sử dụng React Context API để quản lý state toàn cục một cách hiệu quả.",
    category: "React",
    publishedAt: "3/12/2024",
    updatedAt: "3/12/2024",
    status: "published",
    views: 78,
    readTime: "6 phút đọc",
    updateLogs: [],
  },
  {
    id: "5",
    title: "React Performance - Tối ưu hóa ứng dụng",
    content: `# React Performance Optimization

Các kỹ thuật tối ưu hóa hiệu suất cho ứng dụng React...`,
    excerpt:
      "Khám phá các kỹ thuật tối ưu hóa hiệu suất để làm ứng dụng React chạy nhanh hơn.",
    category: "React",
    publishedAt: "1/12/2024",
    updatedAt: "1/12/2024",
    status: "published",
    views: 95,
    readTime: "15 phút đọc",
    updateLogs: [],
  },
  {
    id: "6",
    title: "Custom Hooks trong React",
    content: `# Custom Hooks

Tạo custom hooks để tái sử dụng logic trong React...`,
    excerpt:
      "Tìm hiểu cách tạo custom hooks để tái sử dụng logic và làm code sạch hơn.",
    category: "React",
    publishedAt: "28/11/2024",
    updatedAt: "28/11/2024",
    status: "published",
    views: 63,
    readTime: "9 phút đọc",
    updateLogs: [],
  },
];

const initialCategories: Category[] = [
  {
    id: "react",
    name: "React",
    description: "Thư viện JavaScript phổ biến để xây dựng user interface",
    postCount: 4,
    recentPosts: [
      "Hướng dẫn sử dụng React Hooks hiệu quả",
      "React Context API - Quản lý state toàn cục",
      "React Performance - Tối ưu hóa ứng dụng",
    ],
  },
  {
    id: "typescript",
    name: "TypeScript",
    description: "Ngôn ngữ lập trình mạnh với type system cho JavaScript",
    postCount: 1,
    recentPosts: ["TypeScript Best Practices trong dự án lớn"],
  },
  {
    id: "css",
    name: "CSS",
    description: "Styling và thiết kế giao diện web hiện đại",
    postCount: 1,
    recentPosts: ["Design System với TailwindCSS"],
  },
];

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedPosts = localStorage.getItem("blog-posts");
      const savedCategories = localStorage.getItem("blog-categories");

      if (savedPosts) {
        const parsedPosts = JSON.parse(savedPosts);
        if (Array.isArray(parsedPosts)) {
          setPosts(parsedPosts);
        } else {
          setPosts(initialPosts);
        }
      } else {
        setPosts(initialPosts);
      }

      if (savedCategories) {
        const parsedCategories = JSON.parse(savedCategories);
        if (Array.isArray(parsedCategories)) {
          // Clean up any duplicate categories that might exist
          const cleanedCategories = mergeCategories(parsedCategories);
          setCategories(cleanedCategories);
        } else {
          setCategories(initialCategories);
        }
      } else {
        setCategories(initialCategories);
      }
    } catch (error) {
      console.warn(
        "Failed to load data from localStorage, using initial data:",
        error,
      );
      setPosts(initialPosts);
      setCategories(initialCategories);
    }

    setIsLoading(false);
  }, []);

  // Save to localStorage whenever data changes (debounced to prevent race conditions)
  useEffect(() => {
    if (!isLoading && posts.length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem("blog-posts", JSON.stringify(posts));
        } catch (error) {
          console.warn("Failed to save posts to localStorage:", error);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [posts, isLoading]);

  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem("blog-categories", JSON.stringify(categories));
        } catch (error) {
          console.warn("Failed to save categories to localStorage:", error);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [categories, isLoading]);

  const createPost = useCallback(
    (
      postData: Omit<
        Post,
        "id" | "publishedAt" | "updatedAt" | "views" | "updateLogs"
      >,
    ) => {
      // Sửa lại cách lấy ngày giờ
      const now = format(new Date(), 'dd/MM/yyyy');
      const newPost: Post = {
        ...postData,
        id: Date.now().toString(),
        publishedAt: now,
        updatedAt: now,
        views: 0,
        updateLogs: [],
      };

      setPosts((prev) => [newPost, ...prev]);

      // Update category count
      setCategories((prev) => {
        const categoryId = postData.category
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        const existingCategory = prev.find(
          (cat) =>
            cat.id === categoryId ||
            cat.name.toLowerCase().trim() ===
              postData.category.toLowerCase().trim(),
        );

        if (existingCategory) {
          return prev.map((cat) =>
            cat.id === existingCategory.id
              ? {
                  ...cat,
                  postCount: cat.postCount + 1,
                  recentPosts: [postData.title, ...cat.recentPosts.slice(0, 2)],
                }
              : cat,
          );
        } else {
          // Create new category if it doesn't exist
          const newCategory: Category = {
            id: categoryId,
            name: postData.category.trim(),
            description: `Danh mục ${postData.category}`,
            postCount: 1,
            recentPosts: [postData.title],
          };
          return [...prev, newCategory];
        }
      });
    },
    [],
  );

  const updatePost = useCallback((id: string, postData: Partial<Post>) => {
    // Sửa lại cách lấy ngày giờ
    const now = format(new Date(), 'dd/MM/yyyy');
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              ...postData,
              updatedAt: now,
            }
          : post,
      ),
    );
  }, []);

  const deletePost = useCallback((id: string) => {
    setPosts((prev) => {
      const post = prev.find((p) => p.id === id);
      if (post) {
        // Update category count
        setCategories((categories) =>
          categories.map((cat) =>
            cat.id === post.category.toLowerCase()
              ? { ...cat, postCount: Math.max(0, cat.postCount - 1) }
              : cat,
          ),
        );
        return prev.filter((p) => p.id !== id);
      }
      return prev;
    });
  }, []);

  const getPost = useCallback(
    (id: string) => {
      return posts.find((post) => post.id === id);
    },
    [posts],
  );

  const searchPosts = useCallback((query: string) => {
    if (!query.trim()) {
      return []; // Không tìm gì nếu ô tìm kiếm trống
    }

    // Cấu hình cho Fuse.js
    const fuseOptions = {
      // Tìm kiếm trong các trường này
      keys: [
        { name: 'title', weight: 0.6 },    // Ưu tiên tiêu đề (trọng số 0.6)
        { name: 'excerpt', weight: 0.3 }, // Đoạn trích (trọng số 0.3)
      ],
      includeScore: true,
      threshold: 0.4, // Độ "mờ", 0.0 là chính xác tuyệt đối, 1.0 là tìm gì cũng ra
      minMatchCharLength: 2, // Bắt đầu tìm khi gõ từ 2 ký tự
    };

    const fuse = new Fuse(posts, fuseOptions);
    const results = fuse.search(query);

    // Fuse.js trả về kết quả có dạng { item: Post, score: ... }, ta chỉ cần lấy item
    return results.map(result => result.item);
  },
  [posts], // Chỉ tạo lại hàm này khi danh sách bài viết thay đổi
);

  const getPostsByCategory = useCallback(
    (category: string) => {
      // Find the category to get its exact name
      const categoryInfo = categories.find(
        (cat) =>
          cat.id === category ||
          cat.name.toLowerCase() === category.toLowerCase(),
      );

      if (categoryInfo) {
        return posts.filter(
          (post) =>
            post.category.toLowerCase() === categoryInfo.name.toLowerCase(),
        );
      }

      // Fallback to direct comparison
      return posts.filter(
        (post) => post.category.toLowerCase() === category.toLowerCase(),
      );
    },
    [posts, categories],
  );

  const incrementViews = useCallback((id: string) => {
  setPosts((prev) =>
    prev.map((post) =>
      post.id === id
        ? { ...post, views: post.views + 1, lastViewedAt: Date.now() } // Thêm lastViewedAt
        : post,
    ),
  );
}, []);

  const updateCategory = useCallback(
    (id: string, name: string, description: string) => {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, name, description } : cat,
        ),
      );

      // Update all posts that use this category
      setPosts((prev) =>
        prev.map((post) => {
          const categoryMatch = categories.find((cat) => cat.id === id);
          if (categoryMatch && post.category === categoryMatch.name) {
            return { ...post, category: name };
          }
          return post;
        }),
      );
    },
    [categories],
  );

  const createCategory = useCallback(
    (name: string, description: string) => {
      const categoryId = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      // Check if category already exists with more robust checking
      const existingCategory = categories.find(
        (cat) =>
          cat.id === categoryId ||
          cat.name.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      if (existingCategory) {
        throw new Error("Danh mục này đã tồn tại");
      }

      const newCategory = {
        id: categoryId,
        name: name.trim(),
        description: description.trim(),
        postCount: 0,
        recentPosts: [],
      };

      setCategories((prev) => [...prev, newCategory]);
    },
    [categories],
  );

  const value: BlogContextType = {
    posts,
    categories,
    setCategories,
    createPost,
    updatePost,
    deletePost,
    getPost,
    searchPosts,
    getPostsByCategory,
    incrementViews,
    updateCategory,
    createCategory,
    isLoading,
  };

  return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
}
