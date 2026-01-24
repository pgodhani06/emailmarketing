'use client';

import { useState, useEffect } from 'react';

interface EmailList {
  _id: string;
  name: string;
  description: string;
  totalCount: number;
}

export default function EmailListsPage() {
  const [lists, setLists] = useState<EmailList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/email-lists');
      if (!res.ok) throw new Error('Failed to fetch lists');
      const data = await res.json();
      setLists(data);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
      setError('Failed to load email lists');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('List name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/email-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, emails: [] }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create email list');
      }

      const newList = await res.json();
      setLists([...lists, newList]);
      setFormData({ name: '', description: '' });
      setShowForm(false);
      setSuccess('Email list created successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create list';
      console.error('Failed to create list:', error);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this email list?')) {
      try {
        const res = await fetch(`/api/email-lists/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete list');
        
        setLists(lists.filter(list => list._id !== id));
        setSuccess('Email list deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete list';
        console.error('Failed to delete list:', error);
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Email Lists</h2>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New List
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold mb-4">Create New Email List</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              List Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Newsletter Subscribers"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              placeholder="e.g., Subscribers for monthly newsletter..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {submitting ? 'Creating...' : 'Create List'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setFormData({ name: '', description: '' });
                setError('');
              }} 
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading email lists...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lists.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No email lists yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lists.map((list) => (
                <div 
                  key={list._id} 
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex justify-between items-center"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{list.name}</h3>
                    {list.description && (
                      <p className="text-gray-600 text-sm mt-1">{list.description}</p>
                    )}
                    <p className="text-sm text-blue-600 mt-2 font-medium">
                      {list.totalCount} {list.totalCount === 1 ? 'subscriber' : 'subscribers'}
                    </p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <a
                      href={`/email-lists/${list._id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Manage
                    </a>
                    <button
                      onClick={() => handleDelete(list._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
