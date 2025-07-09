import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  orderBy,
  runTransaction,
  where,
  getDocs,
  writeBatch,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { db, auth } from "@/firebaseConfig";
import Fuse from "fuse.js";

// Định nghĩa các Interfaces (Kiểu dữ liệu)
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  publishedAt: Timestamp;
  updatedAt: Timestamp;
  status: "draft" | "published";
  views: number;
  readTime: string;
  updateLogs: UpdateLog[];
  lastViewedAt?: number;
  authorId?: string;
}

export interface PostForDisplay extends Omit<Post, 'publishedAt' | 'updatedAt'> {
  publishedAt: string;
  updatedAt: string;
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
}

// Định nghĩa kiểu dữ liệu cho Context
interface BlogContextType {
  posts: PostForDisplay[];
  categories: Category[];
  user: User | null;
  isAuthLoading: boolean; // <-- State quan trọng để kiểm tra xác thực
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createPost: (postData: Omit<Post, "id" | "publishedAt" | "updatedAt" | "views" | "updateLogs">) => Promise<void>;
  updatePost: (id: string, postData: Partial<Omit<Post, 'id'>>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  getPost: (id: string) => PostForDisplay | undefined;
  searchPosts: (query: string) => PostForDisplay[];
  getPostsByCategory: (categoryName: string) => PostForDisplay[];
  incrementViews: (id: string) => Promise<void>;
  updateCategory: (id: string, name: string, description: string) => Promise<void>;
  createCategory: (name: string, description: string) => Promise<void>;
  isLoading: boolean; // State loading cho dữ liệu (posts, categories)
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlog must be used within a BlogProvider");
  }
  return context;
}

// Hàm format lại dữ liệu Post để hiển thị cho đẹp
const formatPostForDisplay = (post: Post): PostForDisplay => ({
  ...post,
  publishedAt: post.publishedAt ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString("vi-VN") : "",
  updatedAt: post.updatedAt ? new Date(post.updatedAt.seconds * 1000).toLocaleDateString("vi-VN") : "",
});

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [rawPosts, setRawPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // --- LOGIC CỐT LÕI NẰM Ở ĐÂY ---
  // 1. State `isAuthLoading` bắt đầu là `true`. App sẽ ở trạng thái chờ.
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // 2. `onAuthStateChanged` lắng nghe trạng thái đăng nhập từ Firebase.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Cập nhật user
      // 3. Sau khi có kết quả (dù đăng nhập hay chưa), set `isAuthLoading` thành `false`.
      // Lúc này App mới bắt đầu render giao diện chính hoặc trang Login.
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Lấy dữ liệu posts, chỉ chạy khi user đã được xác thực
  useEffect(() => {
    if (user) {
      const postsQuery = query(collection(db, "posts"), orderBy("publishedAt", "desc"));
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];
        setRawPosts(postsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching posts: ", error);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else if (!isAuthLoading) { // Nếu không có user và đã xác thực xong
      setRawPosts([]);
      setIsLoading(false);
    }
  }, [user, isAuthLoading]);

  // Lấy dữ liệu categories, chỉ chạy khi user đã được xác thực
  useEffect(() => {
    if (user) {
      const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
      const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
        const categoriesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Category[];
        setCategories(categoriesData);
      }, (error) => {
        console.error("Error fetching categories: ", error);
      });
      return () => unsubscribe();
    } else if (!isAuthLoading) {
      setCategories([]);
    }
  }, [user, isAuthLoading]);

  // Các hàm chức năng của mày (giữ nguyên)
  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const createPost = useCallback(async (postData: Omit<Post, "id" | "publishedAt" | "updatedAt" | "views" | "updateLogs">) => {
    if (!auth.currentUser) throw new Error("Bạn phải đăng nhập để tạo bài viết.");
    const postsCollection = collection(db, "posts");
    const now = Timestamp.now();
    const newPostData = { ...postData, authorId: auth.currentUser.uid, publishedAt: now, updatedAt: now, views: 0, updateLogs: [] };
    await addDoc(postsCollection, newPostData);
    // TODO: Cập nhật postCount cho category
  }, []);
  
  const deletePost = useCallback(async (id: string) => {
    const postToDelete = rawPosts.find(p => p.id === id);
    if (!postToDelete) throw new Error("Không tìm thấy bài viết.");
    if (!auth.currentUser || auth.currentUser.uid !== postToDelete.authorId) {
        throw new Error("Bạn không có quyền xóa bài viết này.");
    }
    const postDocRef = doc(db, "posts", id);
    await deleteDoc(postDocRef);
    // TODO: Cập nhật postCount cho category
  }, [rawPosts, auth.currentUser]);
  
  const updatePost = useCallback(async (id: string, postData: Partial<Omit<Post, 'id'>>) => {
    const postDoc = doc(db, "posts", id);
    await updateDoc(postDoc, { ...postData, updatedAt: Timestamp.now() });
  }, []);

  const getPost = useCallback((id: string) => {
    const post = rawPosts.find((post) => post.id === id);
    return post ? formatPostForDisplay(post) : undefined;
  }, [rawPosts]);

  const searchPosts = useCallback((query: string) => {
    if (!query.trim()) return [];
    const fuse = new Fuse(rawPosts, { keys: ["title", "excerpt"], threshold: 0.4 });
    return fuse.search(query).map(result => formatPostForDisplay(result.item));
  }, [rawPosts]);

  const getPostsByCategory = useCallback((categoryName: string) => {
    return rawPosts
      .filter(post => post.category.toLowerCase() === categoryName.toLowerCase())
      .map(formatPostForDisplay);
  }, [rawPosts]);

  const incrementViews = useCallback(async (id: string) => {
    const postDoc = doc(db, "posts", id);
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(postDoc);
      if (!sfDoc.exists()) throw "Document does not exist!";
      const newViews = (sfDoc.data().views || 0) + 1;
      transaction.update(postDoc, { views: newViews, lastViewedAt: Date.now() });
    });
  }, []);

  const createCategory = useCallback(async (name: string, description: string) => {
    if (!auth.currentUser) throw new Error("Bạn phải đăng nhập để tạo danh mục.");
    const categoryId = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existingCategory = categories.find(cat => cat.id === categoryId || cat.name.toLowerCase() === name.toLowerCase());
    if (existingCategory) throw new Error("Danh mục đã tồn tại.");
    const categoryDoc = doc(db, "categories", categoryId);
    await setDoc(categoryDoc, { name: name.trim(), description: description.trim(), postCount: 0 });
  }, [categories, auth.currentUser]);

  const updateCategory = useCallback(async (id: string, name: string, description: string) => {
    if (!auth.currentUser) throw new Error("Bạn phải đăng nhập để sửa danh mục.");
    const categoryDoc = doc(db, "categories", id);
    const oldCategoryName = categories.find(c => c.id === id)?.name;
    await updateDoc(categoryDoc, { name, description });
    if (oldCategoryName && oldCategoryName.toLowerCase() !== name.toLowerCase()) {
        const postsToUpdateQuery = query(collection(db, "posts"), where("category", "==", oldCategoryName));
        const querySnapshot = await getDocs(postsToUpdateQuery);
        const batch = writeBatch(db);
        querySnapshot.forEach((postDoc) => {
            batch.update(postDoc.ref, { category: name });
        });
        await batch.commit();
    }
  }, [categories, auth.currentUser]);

  const value: BlogContextType = {
    posts: rawPosts.map(formatPostForDisplay),
    categories,
    user,
    isAuthLoading,
    login,
    logout,
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
