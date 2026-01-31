"use client";
import { useEffect, useState } from "react";

export default function SmtpSettingsPage() {
  const [senderEmail, setSenderEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true); // loading is used for fetchSettings
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings/smtp");
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setSenderEmail(data.senderEmail || "");
      // If password exists in DB, show masked value (not the real password)
      if (data.hasPassword) {
        setPassword("********");
      } else {
        setPassword("");
      }
    } catch (e) {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderEmail, password }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Settings saved!");
      setTimeout(() => {
        setSuccess("");
        fetchSettings();
      }, 2000);
    } catch (e) {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">SMTP Settings</h2>
      {loading ? (
        <div className="mb-4 p-2 bg-gray-100 text-gray-700 rounded">Loading settings...</div>
      ) : (
        <>
          {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
          {success && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{success}</div>}
          <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded shadow">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sender Email</label>
              <input
                type="email"
                value={senderEmail}
                onChange={e => setSenderEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">App Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
