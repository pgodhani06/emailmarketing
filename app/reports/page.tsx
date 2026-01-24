'use client';

import { useState, useEffect } from 'react';

interface CampaignReport {
  _id: string;
  name: string;
  sentCount: number;
  status: string;
}

interface ReportStats {
  total: number;
  sent: number;
  opened: number;
  failed: number;
  openRate: number;
}

export default function ReportsPage() {
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setError(null);
      const res = await fetch('/api/campaigns');
      if (!res.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      setCampaigns(await res.json());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch campaigns';
      setError(errorMsg);
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCampaignSelect = async (campaignId: string) => {
    if (!campaignId) {
      setSelectedCampaign('');
      setStats(null);
      setStatsError(null);
      return;
    }
    
    setSelectedCampaign(campaignId);
    setStatsLoading(true);
    setStatsError(null);
    try {
      const res = await fetch(`/api/reports/${campaignId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch report');
      }
      setStats(await res.json());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch report';
      setStatsError(errorMsg);
      console.error('Failed to fetch report:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Campaign Reports</h2>

      {error && (
        <div className="card mb-8 bg-red-50 border border-red-200 text-red-700 p-4">
          Error: {error}
        </div>
      )}

      <div className="card mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Campaign
        </label>
        <select
          value={selectedCampaign}
          onChange={(e) => handleCampaignSelect(e.target.value)}
          className="input-field"
        >
          <option value="">Choose a campaign...</option>
          {campaigns.map((campaign) => (
            <option key={campaign._id} value={campaign._id}>
              {campaign.name} ({campaign.sentCount} sent)
            </option>
          ))}
        </select>
      </div>

      {statsError && (
        <div className="card mb-8 bg-red-50 border border-red-200 text-red-700 p-4">
          Error loading report: {statsError}
        </div>
      )}

      {statsLoading && (
        <div className="card mb-8 text-gray-600">
          Loading report data...
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="card">
            <p className="text-gray-600 text-sm">Total Sent</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.sent}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Opened</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats.opened}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Failed</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Open Rate</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.openRate}%</p>
          </div>
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <p className="text-gray-500">No campaigns found. Create one first!</p>
      )}
    </div>
  );
}
