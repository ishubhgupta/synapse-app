'use client';

import { useState } from 'react';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';

interface BookmarkFormProps {
  onSuccess?: () => void;
}

export function BookmarkForm({ onSuccess }: BookmarkFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          url: url || undefined,
          rawContent: rawContent || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create bookmark');
      }

      // Reset form
      setTitle('');
      setUrl('');
      setRawContent('');
      setIsOpen(false);

      // Notify parent
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all hover:shadow-md"
      >
        <Plus className="h-4 w-4" />
        Add Bookmark
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg animate-in fade-in slide-in-from-top-4">
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Bookmark</h2>
            <p className="text-sm text-gray-500">AI will auto-generate tags and category</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-100 p-4">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Enter a descriptive title..."
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-2">
            URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-2">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="content"
            rows={4}
            value={rawContent}
            onChange={(e) => setRawContent(e.target.value)}
            className="block w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-gray-900 ring-1 ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            placeholder="Add any notes, thoughts, or description..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Save Bookmark
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
