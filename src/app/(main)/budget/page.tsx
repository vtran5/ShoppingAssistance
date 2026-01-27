'use client';

export default function BudgetPage() {
  return (
    <div className="px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Budget Suggestions
        </h2>
        <p className="text-gray-500 mb-4">
          Coming soon! This feature will help you decide what to buy based on
          your budget.
        </p>
        <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm">
          Enter your budget and get smart suggestions based on item priority and
          price.
        </div>
      </div>
    </div>
  );
}
