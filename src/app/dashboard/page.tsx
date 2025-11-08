'use client';

import { useEffect, useState } from 'react';
import { Bookmark } from '@/types/bookmark';
import { BookmarkForm } from '@/components/BookmarkForm';
import { BookmarkGrid } from '@/components/BookmarkGrid';
import { Navbar } from '@/components/Navbar';

export default function DashboardPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>();

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={userEmail} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">My Bookmarks</h2>
          <BookmarkForm onSuccess={fetchBookmarks} />
        </div>

        <BookmarkGrid
          bookmarks={bookmarks}
          loading={loading}
          onDelete={fetchBookmarks}
        />
      </main>
    </div>
  );
}
