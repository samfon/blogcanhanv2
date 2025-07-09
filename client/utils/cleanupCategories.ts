import { Category } from "@/contexts/BlogContext";

export function removeDuplicateCategories(categories: Category[]): Category[] {
  const seen = new Set<string>();
  const unique: Category[] = [];

  for (const category of categories) {
    const key = category.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(category);
    }
  }

  return unique;
}

export function mergeCategories(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>();

  for (const category of categories) {
    const key = category.name.toLowerCase().trim();
    const existing = categoryMap.get(key);

    if (existing) {
      // Merge the categories - keep the one with higher post count
      const merged: Category = {
        ...existing,
        postCount: Math.max(existing.postCount, category.postCount),
        recentPosts: [
          ...new Set([...existing.recentPosts, ...category.recentPosts]),
        ].slice(0, 3),
        description: existing.description || category.description,
      };
      categoryMap.set(key, merged);
    } else {
      categoryMap.set(key, { ...category });
    }
  }

  return Array.from(categoryMap.values());
}
