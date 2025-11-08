'use client';

import { useEffect, useState } from 'react';
import { Bookmark } from '@/types/bookmark';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkGrid } from '@/components/BookmarkGrid';
import { Navbar } from '@/components/Navbar';
import SmartSearch from '@/components/SmartSearch';
import { Filter, LayoutGrid, List } from 'lucide-react';

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);

      const endpoint = searchQuery || selectedCategory || selectedType 
        ? `/api/bookmarks/search?${params.toString()}`
        : '/api/bookmarks';

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarks');
      }

      const data = await response.json();
      setBookmarks(data.bookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch user info
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUserEmail(data.email))
      .catch(console.error);

    fetchBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, selectedType]);

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
  };

  const activeFilterCount = [searchQuery, selectedCategory, selectedType].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar userEmail={userEmail} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                My Bookmarks
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {loading ? 'Loading...' : `${bookmarks.length} saved items`}
              </p>
            </div>
            <BookmarkForm onSuccess={fetchBookmarks} />
          </div>
        </div>

        {/* Smart Search */}
        <div className="mb-6">
          <SmartSearch 
            onResults={(results) => {
              setBookmarks(results as Bookmark[]);
              setLoading(false);
            }}
            onClear={() => {
              fetchBookmarks();
            }}
          />
        </div>

        {/* Search and Controls */}
        <div className="mb-6 space-y-4">
          {/* Controls Row */}
          <div className="flex gap-3 justify-end">

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 rounded-xl px-5 py-3.5 font-medium transition-all shadow-sm ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg p-2 transition-all ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg p-2 transition-all ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="List view"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 animate-in slide-in-from-top-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="rounded-lg border-0 bg-gray-50 px-4 py-2 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Categories</option>
                  <option value="work">💼 Work</option>
                  <option value="personal">👤 Personal</option>
                  <option value="research">🔬 Research</option>
                  <option value="inspiration">✨ Inspiration</option>
                  <option value="shopping">🛍️ Shopping</option>
                  <option value="entertainment">🎬 Entertainment</option>
                  <option value="learning">📚 Learning</option>
                </select>

                {/* Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeFilter(e.target.value)}
                  className="rounded-lg border-0 bg-gray-50 px-4 py-2 text-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="">All Types</option>
                  <option value="article">📄 Articles</option>
                  <option value="video">🎥 Videos</option>
                  <option value="product">🛍️ Products</option>
                  <option value="tweet">🐦 Tweets</option>
                  <option value="note">📝 Notes</option>
                  <option value="image">🖼️ Images</option>
                </select>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-all"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Active Filters Tags */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">×</button>
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')} className="hover:text-purple-900">×</button>
                </span>
              )}
              {selectedType && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Type: {selectedType}
                  <button onClick={() => setSelectedType('')} className="hover:text-green-900">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        <BookmarkGrid
          bookmarks={bookmarks}
          loading={loading}
          onDelete={fetchBookmarks}
          viewMode={viewMode}
        />
      </main>
    </div>
  );
}
