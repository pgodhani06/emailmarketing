'use client';

import { useState, useEffect } from 'react';

interface Template {
  _id: string;
  name: string;
  subject: string;
  variables: string[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    htmlContent: '<p>Hello {{firstName}},</p><p>Your message here...</p>',
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      setTemplates(await res.json());
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: '', subject: '', htmlContent: '' });
        setShowForm(false);
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleEdit = (template: Template) => {
    setFormData({
      name: template.name,
      subject: template.subject,
      htmlContent: (template as any).htmlContent || '',
    });
    setEditId(template._id);
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    try {
      const res = await fetch(`/api/templates/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: '', subject: '', htmlContent: '' });
        setEditId(null);
        setShowForm(false);
        fetchTemplates();
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) {
      try {
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        fetchTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Email Templates</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + New Template
        </button>
      </div>

      {/* Available Variables Section */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-2">Available Variables</h4>
        <div className="bg-blue-50 border border-blue-200 rounded px-4 py-3 text-sm text-blue-900">
          <span className="font-semibold">firstName</span>, <span className="font-semibold">lastName</span>, <span className="font-semibold">company</span>, <span className="font-semibold">name</span>, <span className="font-semibold">email</span>, <span className="font-semibold">websiteUrl</span>, <span className="font-semibold">notes</span>
          <br />
          <span className="text-gray-500">(You can use these as <code>{`{{variable}}`}</code> in your template content.)</span>
        </div>
      </div>

      {showForm && (
        <form onSubmit={editId ? handleUpdate : handleSubmit} className="card mb-8">
          <input
            type="text"
            placeholder="Template Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-field mb-4"
            required
          />
          <input
            type="text"
            placeholder="Email Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="input-field mb-4"
            required
          />
          <textarea
            placeholder="HTML Content (use {{variableName}} for dynamic content)"
            value={formData.htmlContent}
            onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
            className="input-field mb-4"
            rows={8}
            required
          />

          {/* Show extracted variables (read-only) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Variables Detected:</label>
            <div className="bg-gray-100 rounded px-3 py-2 text-sm text-gray-700">
              {Array.from(new Set((formData.htmlContent.match(/{{(\w+)}}/g) || []).map(v => v.replace(/[{}]/g, '')))).join(', ') || 'None'}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editId ? 'Update Template' : 'Save Template'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setFormData({ name: '', subject: '', htmlContent: '' }); }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {templates.length === 0 ? (
            <p className="text-gray-500">No templates yet. Create one to get started!</p>
          ) : (
            templates.map((template) => (
              <div key={template._id} className="card">
                <h3 className="font-bold text-lg">{template.name}</h3>
                <p className="text-gray-600 mt-2">Subject: {template.subject}</p>
                {template.variables.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    <span className="font-semibold">Variables:</span> {template.variables.join(', ')}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(template)}
                    className="btn-primary mt-4 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template._id)}
                    className="btn-secondary mt-4"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
