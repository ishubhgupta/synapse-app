import Link from 'next/link';
import { Bookmark, Chrome, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-blue-600">Synapse</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Your Smart Bookmark
            <span className="text-blue-600"> Manager</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Save, organize, and rediscover web content effortlessly. Synapse automatically
            extracts metadata, detects content types, and keeps everything beautifully
            organized.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start for Free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Chrome className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Chrome Extension
            </h3>
            <p className="mt-2 text-gray-600">
              Save any webpage with one click. Works seamlessly across all your favorite
              sites.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Auto Metadata Extraction
            </h3>
            <p className="mt-2 text-gray-600">
              Automatically extracts titles, thumbnails, descriptions, and more from your
              saved content.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Secure & Private
            </h3>
            <p className="mt-2 text-gray-600">
              Your bookmarks are encrypted and stored securely. Only you have access to your
              data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
