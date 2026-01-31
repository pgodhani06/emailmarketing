import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Email Marketing Platform',
  description: 'Manage and track your email campaigns',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-primary">📧 Email Marketing</h1>
              </div>
              <div className="flex gap-4 items-center">
                <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/email-lists" className="text-gray-600 hover:text-gray-900">Lists</a>
                <a href="/templates" className="text-gray-600 hover:text-gray-900">Templates</a>
                <a href="/campaigns" className="text-gray-600 hover:text-gray-900">Campaigns</a>
                <a href="/reports" className="text-gray-600 hover:text-gray-900">Reports</a>
                <a href="/settings" className="text-gray-600 hover:text-gray-900">Settings</a>
                <form id="logout-form" action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="text-gray-600 hover:text-red-600 font-semibold ml-4"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
