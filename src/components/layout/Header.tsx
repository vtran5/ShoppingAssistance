'use client';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          Shopping Assistant
        </h1>
      </div>
    </header>
  );
}
