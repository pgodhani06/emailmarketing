'use client';

import { useState, useEffect } from 'react';

interface Campaign {
  _id: string;
  name: string;
  status: string;
  sentCount: number;
  openedCount: number;
  failedCount?: number;
  totalRecipients?: number;
  scheduledFor: string;
}

interface CampaignEmail {
  _id: string;
  recipientEmail: string;
  status: 'sent' | 'opened' | 'failed' | 'bounced';
  sentAt: string;
  openedAt?: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lists, setLists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [campaignEmails, setCampaignEmails] = useState<Record<string, CampaignEmail[]>>({});
  const [loadingEmails, setLoadingEmails] = useState<Record<string, boolean>>({});
  const [reRunningId, setReRunningId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    emailListId: '',
    templateId: '',
    scheduledFor: '',
    perDayLimit: 1,
  });

  useEffect(() => {
    fetchCampaigns();
    fetchLists();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns');
      if (!res.ok) throw new Error('Failed to fetch campaigns');
      setCampaigns(await res.json());
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignEmails = async (campaignId: string) => {
    try {
      setLoadingEmails(prev => ({ ...prev, [campaignId]: true }));
      const res = await fetch(`/api/campaigns/${campaignId}/emails`);
      if (!res.ok) throw new Error('Failed to fetch campaign emails');
      const emails = await res.json();
      setCampaignEmails(prev => ({ ...prev, [campaignId]: emails }));
    } catch (err) {
      console.error('Failed to fetch campaign emails:', err);
      setError('Failed to load email list');
    } finally {
      setLoadingEmails(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleExpandCampaign = (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
      if (!campaignEmails[campaignId]) {
        fetchCampaignEmails(campaignId);
      }
    }
  };

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/email-lists');
      if (!res.ok) throw new Error('Failed to fetch lists');
      setLists(await res.json());
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      setTemplates(await res.json());
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }
    if (!formData.emailListId) {
      setError('Email list is required');
      return;
    }
    if (!formData.templateId) {
      setError('Template is required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('Submitting campaign with data:', formData);
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }
      
      setFormData({ name: '', emailListId: '', templateId: '', scheduledFor: '', perDayLimit: 1 });
      setShowForm(false);
      setSuccess('Campaign created successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchCampaigns();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
      console.error('Failed to create campaign:', error);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('Send this campaign now?')) return;

    setSendingId(id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to send campaign');
      }

      const result = await res.json();
      setSuccess(`Campaign sent! Sent: ${result.sentCount}, Failed: ${result.failedCount}`);
      setTimeout(() => setSuccess(''), 5000);
      fetchCampaigns();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send campaign';
      console.error('Failed to send campaign:', error);
      setError(errorMessage);
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete campaign');
      
      setSuccess('Campaign deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchCampaigns();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete campaign';
      console.error('Failed to delete campaign:', error);
      setError(errorMessage);
    }
  };

  const handleReRun = async (id: string) => {
    if (!confirm('Re-run this campaign? New report entries will be created.')) return;

    setReRunningId(id);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to re-run campaign');
      }

      const result = await res.json();
      setSuccess(`Campaign re-run successful! Sent: ${result.sentCount}, Failed: ${result.failedCount}`);
      setTimeout(() => setSuccess(''), 5000);
      fetchCampaigns();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to re-run campaign';
      console.error('Failed to re-run campaign:', error);
      setError(errorMessage);
    } finally {
      setReRunningId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Campaigns</h2>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            setError('');
            setSuccess('');
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New Campaign
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
          <h3 className="text-xl font-bold mb-4">Create New Campaign</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Spring Newsletter"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email List *
            </label>
            <select
              value={formData.emailListId}
              onChange={(e) => setFormData({ ...formData, emailListId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Email List</option>
              {lists.map((list: any) => (
                <option key={list._id} value={list._id}>{list.name} ({list.totalCount} subscribers)</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Template *
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Template</option>
              {templates.map((template: any) => (
                <option key={template._id} value={template._id}>{template.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Per Day Limit
            </label>
            <input
              type="number"
              min={1}
              value={formData.perDayLimit}
              onChange={e => setFormData({ ...formData, perDayLimit: Number(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule For (Optional)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledFor}
              onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {submitting ? 'Creating...' : 'Create Campaign'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setShowForm(false);
                setFormData({ name: '', emailListId: '', templateId: '', scheduledFor: '', perDayLimit: 1 });
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
          <p className="text-gray-500">Loading campaigns...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">No campaigns yet. Create one to get started!</p>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{campaign.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Status: <span className={`font-medium ${
                          campaign.status === 'completed' ? 'text-green-600' :
                          campaign.status === 'draft' ? 'text-blue-600' :
                          campaign.status === 'running' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>{campaign.status.toUpperCase()}</span>
                      </p>
                      <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-gray-600">Sent</p>
                          <p className="font-bold text-xl text-blue-600">{campaign.sentCount}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-gray-600">Opened</p>
                          <p className="font-bold text-xl text-green-600">{campaign.openedCount}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-gray-600">Failed</p>
                          <p className="font-bold text-xl text-red-600">{campaign.failedCount || 0}</p>
                        </div>
                        {campaign.scheduledFor && (
                          <div className="bg-purple-50 p-3 rounded">
                            <p className="text-gray-600">Scheduled</p>
                            <p className="font-bold text-sm">{new Date(campaign.scheduledFor).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-2">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleSend(campaign._id)}
                          disabled={sendingId === campaign._id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                        >
                          {sendingId === campaign._id ? 'Sending...' : 'Send Now'}
                        </button>
                      )}
                      {campaign.status === 'completed' && (
                        <button
                          onClick={() => handleReRun(campaign._id)}
                          disabled={reRunningId === campaign._id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                        >
                          {reRunningId === campaign._id ? 'Re-Running...' : '🔄 Re-Run'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email List Section */}
                <div className="border-t">
                  <button
                    onClick={() => handleExpandCampaign(campaign._id)}
                    className="w-full px-6 py-3 text-left font-medium text-blue-600 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>📧 Sent Emails ({campaign.sentCount})</span>
                    <span>{expandedCampaign === campaign._id ? '▼' : '▶'}</span>
                  </button>

                  {expandedCampaign === campaign._id && (
                    <div className="bg-gray-50 p-6 border-t">
                      {loadingEmails[campaign._id] ? (
                        <p className="text-gray-500 text-center py-4">Loading emails...</p>
                      ) : campaignEmails[campaign._id] && campaignEmails[campaign._id].length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-white">
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Email</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Sent At</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-700">Opened At</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {campaignEmails[campaign._id].map((email) => (
                                <tr key={email._id} className="hover:bg-white">
                                  <td className="px-4 py-3 text-gray-900">{email.recipientEmail}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      email.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                      email.status === 'opened' ? 'bg-green-100 text-green-800' :
                                      email.status === 'failed' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {email.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 text-xs">
                                    {email.sentAt ? new Date(email.sentAt).toLocaleString() : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600 text-xs">
                                    {email.openedAt ? new Date(email.openedAt).toLocaleString() : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No emails sent yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
