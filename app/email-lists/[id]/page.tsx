'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Subscriber {
  email: string;
  name: string;
  companyName?: string;
  websiteUrl?: string;
  notes?: string;
  emailStatus?: 'Right' | 'Wrong';
  variables?: Record<string, any>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface EmailList {
  _id: string;
  name: string;
  description: string;
  emails: Subscriber[];
  totalCount: number;
}

const ITEMS_PER_PAGE = 10;

export default function EmailListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [list, setList] = useState<EmailList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Right' | 'Wrong'>('All');
  const [sortBy, setSortBy] = useState<'email' | 'name' | 'companyName' | 'emailStatus'>('email');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({ 
    email: '', 
    name: '',
    companyName: '',
    websiteUrl: '',
    notes: '',
    emailStatus: 'Right' as 'Right' | 'Wrong',
  });
  const [submitting, setSubmitting] = useState(false);
  
  const [csvInput, setCSVInput] = useState('');
  const [showCSVForm, setShowCSVForm] = useState(false);
  const [csvSubmitting, setCSVSubmitting] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editSubscriber, setEditSubscriber] = useState({ 
    email: '', 
    name: '',
    companyName: '',
    websiteUrl: '',
    notes: '',
    emailStatus: 'Right' as 'Right' | 'Wrong',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchList();
  }, [id]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/email-lists/${id}`);
      if (!res.ok) throw new Error('Failed to fetch list');
      const data = await res.json();
      setList(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load list';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubscriber.email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSubscriber.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/email-lists/${id}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubscriber),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add subscriber');
      }

      const updatedList = await res.json();
      setList(updatedList);
      setNewSubscriber({ 
        email: '', 
        name: '',
        companyName: '',
        websiteUrl: '',
        notes: '',
        emailStatus: 'Right',
      });
      setShowAddForm(false);
      setSuccess('Subscriber added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add subscriber';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvInput.trim()) {
      setError('Please paste CSV data');
      return;
    }

    setCSVSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const lines = csvInput.trim().split('\n');
      const subscribers = [];

      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        if (parts[0]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(parts[0])) {
            subscribers.push({ 
              email: parts[0],
              name: parts[1] || '',
              companyName: parts[2] || '',
              websiteUrl: parts[3] || '',
              notes: parts[4] || '',
              emailStatus: parts[5] === 'Wrong' ? 'Wrong' : 'Right',
            });
          }
        }
      }

      if (subscribers.length === 0) {
        throw new Error('No valid email addresses found in CSV');
      }

      const res = await fetch(`/api/email-lists/${id}/subscribers/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscribers }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add subscribers');
      }

      const updatedList = await res.json();
      setList(updatedList);
      setCSVInput('');
      setShowCSVForm(false);
      setSuccess(`${subscribers.length} subscriber(s) added successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add subscribers';
      setError(errorMessage);
    } finally {
      setCSVSubmitting(false);
    }
  };

  const handleDeleteSubscriber = async (email: string) => {
    if (confirm(`Are you sure you want to remove ${email}?`)) {
      try {
        const res = await fetch(`/api/email-lists/${id}/subscribers`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) throw new Error('Failed to delete subscriber');
        
        const updatedList = await res.json();
        setList(updatedList);
        setSuccess('Subscriber removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete subscriber';
        setError(errorMessage);
      }
    }
  };

  const handleEditClick = (subscriber: Subscriber) => {
    setEditingEmail(subscriber.email);
    setEditSubscriber({
      email: subscriber.email,
      name: subscriber.name || '',
      companyName: subscriber.companyName || '',
      websiteUrl: subscriber.websiteUrl || '',
      notes: subscriber.notes || '',
      emailStatus: (subscriber.emailStatus || 'Right') as 'Right' | 'Wrong',
    });
    setShowEditForm(true);
  };

  const handleUpdateSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editSubscriber.email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editSubscriber.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setEditSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/email-lists/${id}/subscribers/${editingEmail}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSubscriber),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update subscriber');
      }

      const updatedList = await res.json();
      setList(updatedList);
      setShowEditForm(false);
      setEditingEmail(null);
      setSuccess('Subscriber updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update subscriber';
      setError(errorMessage);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filter subscribers based on search and status
  const filteredSubscribers = list?.emails.filter((subscriber) => {
    const matchesSearch =
      searchQuery === '' ||
      subscriber.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subscriber.name &&
        subscriber.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (subscriber.companyName &&
        subscriber.companyName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (subscriber.notes &&
        subscriber.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterStatus === 'All' ||
      subscriber.emailStatus === filterStatus;

    return matchesSearch && matchesStatus;
  }) || [];

  // Sort subscribers
  const sortedSubscribers = [...filteredSubscribers].sort((a, b) => {
    let aValue = a[sortBy] || '';
    let bValue = b[sortBy] || '';

    // Convert to lowercase for string comparison
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Handle checkbox selection
  const toggleSelectEmail = (email: string) => {
    const newSet = new Set(selectedEmails);
    if (newSet.has(email)) {
      newSet.delete(email);
    } else {
      newSet.add(email);
    }
    setSelectedEmails(newSet);
  };

  // Select all visible subscribers on current page
  const toggleSelectAll = () => {
    if (selectedEmails.size === sortedSubscribers.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(sortedSubscribers.map((sub) => sub.email)));
    }
  };

  // Mass delete selected subscribers
  const handleMassDelete = async () => {
    if (selectedEmails.size === 0) {
      setError('Please select at least one subscriber to delete');
      return;
    }

    const count = selectedEmails.size;
    if (
      !confirm(
        `Are you sure you want to delete ${count} subscriber(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/email-lists/${id}/subscribers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: Array.from(selectedEmails) }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete subscribers');
      }

      const updatedList = await res.json();
      setList(updatedList);
      setSelectedEmails(new Set());
      setCurrentPage(1);
      setSuccess(`${count} subscriber(s) deleted successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete subscribers';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading email list...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="p-8">
        <p className="text-red-500">Email list not found</p>
        <button
          onClick={() => router.push('/email-lists')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Lists
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push('/email-lists')}
          className="text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          ← Back to Lists
        </button>
        <h1 className="text-3xl font-bold">{list.name}</h1>
        {list.description && (
          <p className="text-gray-600 mt-2">{list.description}</p>
        )}
        <p className="text-sm text-blue-600 mt-2 font-medium">
          Total Subscribers: {list.totalCount}
        </p>
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

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Search Subscribers
            </label>
            <input
              type="text"
              placeholder="Search by email, name, or company..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as 'All' | 'Right' | 'Wrong');
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Right">Right ✓</option>
              <option value="Wrong">Wrong ✗</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Results
            </label>
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-900">
              Showing {filteredSubscribers.length} of {list?.totalCount || 0} subscribers
            </div>
          </div>
        </div>

        {(searchQuery || filterStatus !== 'All') && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('All');
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-8">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setShowCSVForm(false);
            setError('');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + Add Subscriber
        </button>
        <button
          onClick={() => {
            setShowCSVForm(!showCSVForm);
            setShowAddForm(false);
            setError('');
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          📋 Import CSV
        </button>
        {selectedEmails.size > 0 && (
          <button
            onClick={handleMassDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            🗑️ Delete Selected ({selectedEmails.size})
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubscriber} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold mb-4">Add New Subscriber</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={newSubscriber.email}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={newSubscriber.name}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={newSubscriber.companyName}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={newSubscriber.websiteUrl}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, websiteUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                placeholder="Add any notes here..."
                value={newSubscriber.notes}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Status
              </label>
              <select
                value={newSubscriber.emailStatus}
                onChange={(e) => setNewSubscriber({ ...newSubscriber, emailStatus: e.target.value as 'Right' | 'Wrong' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Right">Right</option>
                <option value="Wrong">Wrong</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {submitting ? 'Adding...' : 'Add Subscriber'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewSubscriber({ 
                  email: '', 
                  name: '',
                  companyName: '',
                  websiteUrl: '',
                  notes: '',
                  emailStatus: 'Right',
                });
                setError('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showCSVForm && (
        <form onSubmit={handleBulkCSV} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold mb-4">Import Subscribers from CSV</h3>
          
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-2">CSV Format:</p>
            <p>email, name, companyName, websiteUrl, notes, emailStatus</p>
            <p className="mt-2 text-xs">Example:</p>
            <p className="text-xs">john@example.com, John Doe, Acme Corp, https://acme.com, VIP Client, Right</p>
            <p className="text-xs">jane@example.com, Jane Smith, Tech Inc, https://tech.com, Follow up, Wrong</p>
            <p className="text-xs mt-2"><strong>Note:</strong> Email Status should be either "Right" or "Wrong"</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste CSV Data *
            </label>
            <textarea
              placeholder="Paste your CSV data here (one subscriber per line)"
              value={csvInput}
              onChange={(e) => setCSVInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={8}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={csvSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {csvSubmitting ? 'Importing...' : 'Import Subscribers'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCSVForm(false);
                setCSVInput('');
                setError('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showEditForm && (
        <form onSubmit={handleUpdateSubscriber} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-bold mb-4">Edit Subscriber</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={editSubscriber.email}
                onChange={(e) => setEditSubscriber({ ...editSubscriber, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                value={editSubscriber.name}
                onChange={(e) => setEditSubscriber({ ...editSubscriber, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={editSubscriber.companyName}
                onChange={(e) => setEditSubscriber({ ...editSubscriber, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={editSubscriber.websiteUrl}
                onChange={(e) => setEditSubscriber({ ...editSubscriber, websiteUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                placeholder="Add any notes here..."
                value={editSubscriber.notes}
                onChange={(e) => setEditSubscriber({ ...editSubscriber, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Status
              </label>
              <select
                value={editSubscriber.emailStatus}
                onChange={(e) => setEditSubscriber({ ...editSubscriber, emailStatus: e.target.value as 'Right' | 'Wrong' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Right">Right</option>
                <option value="Wrong">Wrong</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={editSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {editSubmitting ? 'Updating...' : 'Update Subscriber'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEditForm(false);
                setEditingEmail(null);
                setError('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold">
            Subscribers ({list.totalCount})
            {filteredSubscribers.length !== list.totalCount && (
              <span className="text-sm text-gray-600 ml-2">
                - {filteredSubscribers.length} filtered
              </span>
            )}
          </h2>
        </div>

        {filteredSubscribers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery || filterStatus !== 'All'
              ? 'No subscribers match your search or filter. Try adjusting your criteria.'
              : 'No subscribers yet. Add one to get started!'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={
                          sortedSubscribers.length > 0 &&
                          selectedEmails.size === sortedSubscribers.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 cursor-pointer"
                        title="Select all subscribers"
                      />
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100">
                      <button
                        onClick={() => {
                          if (sortBy === 'email') {
                            setSortOrder(
                              sortOrder === 'asc' ? 'desc' : 'asc'
                            );
                          } else {
                            setSortBy('email');
                            setSortOrder('asc');
                          }
                        }}
                        className="flex items-center gap-1 w-full"
                      >
                        Email{' '}
                        {sortBy === 'email' &&
                          (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100">
                      <button
                        onClick={() => {
                          if (sortBy === 'name') {
                            setSortOrder(
                              sortOrder === 'asc' ? 'desc' : 'asc'
                            );
                          } else {
                            setSortBy('name');
                            setSortOrder('asc');
                          }
                        }}
                        className="flex items-center gap-1 w-full"
                      >
                        Name{' '}
                        {sortBy === 'name' &&
                          (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100">
                      <button
                        onClick={() => {
                          if (sortBy === 'companyName') {
                            setSortOrder(
                              sortOrder === 'asc' ? 'desc' : 'asc'
                            );
                          } else {
                            setSortBy('companyName');
                            setSortOrder('asc');
                          }
                        }}
                        className="flex items-center gap-1 w-full"
                      >
                        Company{' '}
                        {sortBy === 'companyName' &&
                          (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Website
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700">
                      Updated At
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100">
                      <button
                        onClick={() => {
                          if (sortBy === 'emailStatus') {
                            setSortOrder(
                              sortOrder === 'asc' ? 'desc' : 'asc'
                            );
                          } else {
                            setSortBy('emailStatus');
                            setSortOrder('asc');
                          }
                        }}
                        className="flex items-center gap-1 w-full"
                      >
                        Status{' '}
                        {sortBy === 'emailStatus' &&
                          (sortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sortedSubscribers
                    .slice(
                      (currentPage - 1) * ITEMS_PER_PAGE,
                      currentPage * ITEMS_PER_PAGE
                    )
                    .map((subscriber, index) => {
                      const globalIndex =
                        (currentPage - 1) * ITEMS_PER_PAGE + index;
                      const rowId = globalIndex + 1;
                      return (
                        <tr
                          key={index}
                          className={`hover:bg-gray-50 ${
                            selectedEmails.has(subscriber.email)
                              ? 'bg-blue-50'
                              : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedEmails.has(
                                subscriber.email
                              )}
                              onChange={() =>
                                toggleSelectEmail(subscriber.email)
                              }
                              className="w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-gray-900 font-medium bg-blue-50">
                            #{rowId}
                          </td>
                          <td className="px-6 py-4 text-gray-900">
                            {subscriber.email}
                          </td>
                        <td className="px-6 py-4 text-gray-600">
                          {subscriber.name || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {subscriber.companyName || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {subscriber.websiteUrl ? (
                            <a
                              href={subscriber.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 truncate"
                            >
                              {subscriber.websiteUrl}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                          {subscriber.notes || '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {subscriber.createdAt
                            ? new Date(subscriber.createdAt).toLocaleDateString() +
                              ' ' +
                              new Date(subscriber.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {subscriber.updatedAt
                            ? new Date(subscriber.updatedAt).toLocaleDateString() +
                              ' ' +
                              new Date(subscriber.updatedAt).toLocaleTimeString(
                                [],
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )
                            : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              subscriber.emailStatus === 'Right'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {subscriber.emailStatus || 'Right'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() =>
                                handleEditClick(subscriber)
                              }
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSubscriber(
                                  subscriber.email
                                )
                              }
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {sortedSubscribers.length > ITEMS_PER_PAGE && (
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    sortedSubscribers.length
                  )}{' '}
                  of {sortedSubscribers.length} subscribers
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage(Math.max(1, currentPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({
                      length: Math.ceil(
                        sortedSubscribers.length / ITEMS_PER_PAGE
                      ),
                    }).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-2 rounded-lg transition ${
                          currentPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage(
                        Math.min(
                          Math.ceil(
                            sortedSubscribers.length / ITEMS_PER_PAGE
                          ),
                          currentPage + 1
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.ceil(sortedSubscribers.length / ITEMS_PER_PAGE)
                    }
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </div>
  );
}
