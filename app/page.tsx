'use client';

import { useState, useEffect } from 'react';

interface CampaignStat {
  label: string;
  value: number;
  color: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<CampaignStat[]>([]);
  const [loading, setLoading] = useState(true);
  console.log('Dashboard component rendered',loading);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [campaigns, templates, lists] = await Promise.all([
          fetch('/api/campaigns').then(r => r.json()),
          fetch('/api/templates').then(r => r.json()),
          fetch('/api/email-lists').then(r => r.json()),
        ]);

        setStats([
          { label: 'Total Campaigns', value: campaigns.length || 0, color: 'bg-blue-500' },
          { label: 'Email Templates', value: templates.length || 0, color: 'bg-green-500' },
          { label: 'Email Lists', value: lists.length || 0, color: 'bg-purple-500' },
        ]);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Dashboard</h2>
      
      <div className="grid grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`inline-block p-3 rounded-lg ${stat.color} text-white mb-4`}>
              📊
            </div>
            <h3 className="text-gray-600 text-sm font-medium">{stat.label}</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4">Quick Start</h3>
        <ul className="space-y-3">
          <li>
            <a href="/email-lists" className="text-blue-600 hover:underline">
              ✅ Create your first email list
            </a>
          </li>
          <li>
            <a href="/templates" className="text-blue-600 hover:underline">
              ✅ Design an email template
            </a>
          </li>
          <li>
            <a href="/campaigns" className="text-blue-600 hover:underline">
              ✅ Create and schedule a campaign
            </a>
          </li>
          <li>
            <a href="/reports" className="text-blue-600 hover:underline">
              ✅ View campaign reports and analytics
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
