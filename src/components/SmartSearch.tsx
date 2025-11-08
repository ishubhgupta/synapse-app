'use client';

import { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';

interface SmartSearchProps {
  onResults: (results: unknown[]) => void;
  onClear: () => void;
}

export default function SmartSearch({ onResults, onClear }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearch, setLastSearch] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError('');
    setLastSearch(query);

    try {
      // Try smart search first (if available)
      const smartResponse = await fetch('/api/bookmarks/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      }).catch(() => null);

      // If smart search works, use it
      if (smartResponse && smartResponse.ok) {
        const data = await smartResponse.json();
        if (data.success) {
          onResults(data.data.results);
          console.log('✓ Smart search successful');
          if (data.data.parsed) {
            console.log('Query understanding:', data.data.parsed);
          }
          setIsSearching(false);
          return;
        }
      }

      // Fallback to regular search
      console.log('Using regular search...');
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/bookmarks/search?${params}`);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      onResults(data.bookmarks || []);
      console.log(`Found ${data.bookmarks?.length || 0} results`);
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search bookmarks');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setLastSearch('');
    setError('');
    onClear();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search bookmarks by title, content, tags, or URL..."
            className="w-full pl-12 pr-24 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            disabled={isSearching}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            {(query || lastSearch) && (
              <button
                onClick={handleClear}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={isSearching}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Last Search Indicator */}
        {lastSearch && !isSearching && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Showing results for: <span className="font-medium">&quot;{lastSearch}&quot;</span>
          </div>
        )}
      </div>
    </div>
  );
}
