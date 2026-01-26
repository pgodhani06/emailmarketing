"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '', submit: '' });
  const [loading, setLoading] = useState(false);

  function validate() {
    let valid = true;
    const newErrors = { email: '', password: '', submit: '' };
    if (!form.email.trim()) {
      newErrors.email = 'Email is required.';
      valid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      newErrors.email = 'Invalid email address.';
      valid = false;
    }
    if (!form.password) {
      newErrors.password = 'Password is required.';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({ email: '', password: '', submit: '' });
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(errs => ({ ...errs, submit: data.message || 'Login failed.' }));
      } else {
        
      // console.log('Login response data:', res, data);
        // Redirect to dashboard or home
        router.push('/');
      }
    } catch (err) {
      setErrors(errs => ({ ...errs, submit: 'Network error. Please try again.' }));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-indigo-700">Sign in to your account</h1>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              required
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {errors.submit && <p className="text-sm text-red-500 text-center mt-2">{errors.submit}</p>}
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-600 hover:underline font-medium">Register</Link>
        </p>
      </div>
    </div>
  );
}
