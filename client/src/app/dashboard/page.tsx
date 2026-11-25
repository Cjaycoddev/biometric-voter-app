'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { User, ShieldCheck, LogOut, MapPin, Building2, Mail, Phone, IdCard } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(u));
    fetchTemplates();
  }, [router]);

  const fetchTemplates = async () => {
    try {
      const data = await apiRequest('/biometric/my-templates');
      setTemplates(data.templates || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Mock polling station if not in user object
  const pollingStation = user?.polling_station || {
    name: 'Kasarani Primary School',
    code: 'PS-047-123',
    ward: 'Kasarani',
    constituency: 'Kasarani',
    county: 'Nairobi',
    address: 'Kasarani Primary School Grounds, Thika Road',
    gps: '-1.2197, 36.8881',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <nav className="bg-white p-4 rounded-xl shadow mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">EngageLoop</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:underline flex items-center gap-1">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </nav>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Voter Profile Card */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Voter Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-medium">{user?.full_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <IdCard className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">ID Number</p>
                <p className="font-medium">{user?.id_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium">{user?.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-6 h-6 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Polling Station Card */}
        <div className="bg-white p-6 rounded-xl shadow border border-blue-200 bg-blue-50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-800">
            <MapPin className="w-5 h-5" /> Assigned Polling Station
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700"><strong>Station Name:</strong> {pollingStation.name}</p>
              <p className="text-sm text-blue-700"><strong>Station Code:</strong> {pollingStation.code}</p>
              <p className="text-sm text-blue-700"><strong>Ward:</strong> {pollingStation.ward}</p>
              <p className="text-sm text-blue-700"><strong>Constituency:</strong> {pollingStation.constituency}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700"><strong>County:</strong> {pollingStation.county}</p>
              <p className="text-sm text-blue-700"><strong>Address:</strong> {pollingStation.address}</p>
              <p className="text-sm text-blue-700"><strong>GPS Coordinates:</strong> {pollingStation.gps}</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href={`https://maps.google.com/?q=${pollingStation.gps}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <MapPin className="w-4 h-4" />
              Open in Google Maps
            </a>
          </div>
        </div>

        {/* Enrolled Biometrics */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Enrolled Biometrics
          </h2>
          {templates.length === 0 ? (
            <p className="text-gray-500">No biometric templates enrolled yet.</p>
          ) : (
            <ul className="space-y-3">
              {templates.map((t) => (
                <li key={`${t.user_id}-${t.template_type}`} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="text-sm text-gray-700 capitalize flex items-center gap-2">
                    {t.template_type === 'face' && <span className="text-blue-500">📷</span>}
                    {t.template_type === 'fingerprint' && <span className="text-green-500">👆</span>}
                    {t.template_type}
                  </span>
                  <span className="text-xs text-green-600 font-medium">Enrolled</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/verify" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Verify Identity
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}