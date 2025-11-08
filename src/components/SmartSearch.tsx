'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Clock } from 'lucide-react';

interface SmartSearchProps {
  onResults: (results: unknown[]) => void;
  onClear: () => void;
}

interface Suggestion {
  text: string;
  type: 'recent' | 'suggestion';
}

export default function SmartSearch({ onResults, onClear }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearch, setLastSearch] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Generate suggestions based on query
  useEffect(() => {
    if (!query.trim()) {
      // Show recent searches when input is empty
      const recentSuggestions: Suggestion[] = recentSearches.slice(0, 5).map(text => ({
        text,
        type: 'recent' as const,
      }));
      setSuggestions(recentSuggestions);
      return;
    }

    // Common search patterns and suggestions
    const commonPatterns: Suggestion[] = [
      { text: `${query} articles`, type: 'suggestion' },
      { text: `${query} videos`, type: 'suggestion' },
      { text: `${query} from last month`, type: 'suggestion' },
      { text: `${query} tutorials`, type: 'suggestion' },
    ];

    // Filter to only relevant suggestions
    const filtered = commonPatterns.filter(s => 
      !s.text.toLowerCase().includes('from last month') || query.length > 2
    );

    setSuggestions(filtered.slice(0, 4));
  }, [query, recentSearches]);

  // Real-time search as user types
  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search - wait 800ms after user stops typing (longer for smoother typing)
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 800);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const saveToRecentSearches = (searchQuery: string) => {
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError('');
    setLastSearch(query);
    setShowSuggestions(false);
    
    // Save to recent searches
    if (query.trim()) {
      saveToRecentSearches(query.trim());
    }

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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Clear timeout on change to prevent search while typing
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search bookmarks... Try: 'phone I was looking for' or 'articles about AI'"
            className="w-full pl-12 pr-24 py-3.5 bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
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

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(suggestion.text);
                  setShowSuggestions(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-0"
              >
                {suggestion.type === 'recent' ? (
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <Search className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
                <span className="text-sm text-gray-700">
                  {suggestion.text}
                </span>
                {suggestion.type === 'recent' && (
                  <span className="ml-auto text-xs text-gray-400">Recent</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Last Search Indicator */}
        {lastSearch && !isSearching && !showSuggestions && (
          <div className="mt-2 text-sm text-gray-500">
            Showing results for: <span className="font-medium text-gray-700">&quot;{lastSearch}&quot;</span>
          </div>
        )}
      </div>
    </div>
  );
}
