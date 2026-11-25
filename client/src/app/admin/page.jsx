'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '../../lib/api';
import { useRouter } from 'next/navigation';
import {
  Users, BarChart3, Search, Filter, ChevronDown, ChevronUp,
  Download, RefreshCw, MapPin, Building2, Shield, Eye, AlertCircle,
  CheckCircle, XCircle, Loader2, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const SEX_OPTIONS = ['', 'Male', 'Female', 'Other'];
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
];
const BIOMETRIC_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'enrolled', label: 'Biometric Enrolled' },
  { value: 'not_enrolled', label: 'Not Enrolled' },
];

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [voters, setVoters] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [counties, setCounties] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [wards, setWards] = useState([]);
  const [pollingStations, setPollingStations] = useState([]);
  const [countyStats, setCountyStats] = useState([]);
  const [constituencyStats, setConstituencyStats] = useState([]);
  const [wardStats, setWardStats] = useState([]);
  const [pollingStationStats, setPollingStationStats] = useState([]);

  // Filters
  const [filters, setFilters] = useState({
    q: '',
    county_id: '',
    constituency_id: '',
    ward_id: '',
    polling_station_id: '',
    is_verified: '',
    has_biometric: '',
    sex: '',
    sort: 'created_at',
    order: 'desc',
  });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [verificationLogs, setVerificationLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u || JSON.parse(u).role !== 'admin') {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(u));
    fetchInitialData();
  }, [router]);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchMetrics(),
        fetchCounties(),
        fetchCountyStats(),
        fetchVoters(),
      ]);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await apiRequest('/admin/metrics', { params: filters });
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const fetchCounties = async () => {
    try {
      const data = await apiRequest('/public/counties');
      setCounties(data.data || []);
    } catch (err) {
      console.error('Failed to fetch counties:', err);
    }
  };

  const fetchConstituencies = async (countyId) => {
    try {
      const data = await apiRequest(`/public/constituencies?county_id=${countyId}`);
      setConstituencies(data.data || []);
    } catch (err) {
      console.error('Failed to fetch constituencies:', err);
    }
  };

  const fetchWards = async (constituencyId) => {
    try {
      const data = await apiRequest(`/public/wards?constituency_id=${constituencyId}`);
      setWards(data.data || []);
    } catch (err) {
      console.error('Failed to fetch wards:', err);
    }
  };

  const fetchPollingStations = async (wardId) => {
    try {
      const data = await apiRequest(`/public/polling-stations?ward_id=${wardId}`);
      setPollingStations(data.data || []);
    } catch (err) {
      console.error('Failed to fetch polling stations:', err);
    }
  };

  const fetchCountyStats = async () => {
    try {
      const data = await apiRequest('/admin/stats/counties');
      setCountyStats(data.data || []);
    } catch (err) {
      console.error('Failed to fetch county stats:', err);
    }
  };

  const fetchConstituencyStats = async (countyId) => {
    try {
      const data = await apiRequest(`/admin/stats/constituencies?county_id=${countyId}`);
      setConstituencyStats(data.data || []);
    } catch (err) {
      console.error('Failed to fetch constituency stats:', err);
    }
  };

  const fetchWardStats = async (constituencyId) => {
    try {
      const data = await apiRequest(`/admin/stats/wards?constituency_id=${constituencyId}`);
      setWardStats(data.data || []);
    } catch (err) {
      console.error('Failed to fetch ward stats:', err);
    }
  };

  const fetchPollingStationStats = async (wardId) => {
    try {
      const data = await apiRequest(`/admin/stats/polling-stations?ward_id=${wardId}`);
      setPollingStationStats(data.data || []);
    } catch (err) {
      console.error('Failed to fetch polling station stats:', err);
    }
  };

  const fetchVoters = async (page = 1) => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: pagination.limit };
      const data = await apiRequest('/admin/voters', { params });
      setVoters(data.data || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err) {
      console.error('Failed to fetch voters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleCountyChange = (countyId) => {
    handleFilterChange('county_id', countyId);
    handleFilterChange('constituency_id', '');
    handleFilterChange('ward_id', '');
    handleFilterChange('polling_station_id', '');
    setConstituencies([]);
    setWards([]);
    setPollingStations([]);
    if (countyId) {
      fetchConstituencies(countyId);
      fetchConstituencyStats(countyId);
    } else {
      setConstituencyStats([]);
      fetchCountyStats();
    }
  };

  const handleConstituencyChange = (constituencyId) => {
    handleFilterChange('constituency_id', constituencyId);
    handleFilterChange('ward_id', '');
    handleFilterChange('polling_station_id', '');
    setWards([]);
    setPollingStations([]);
    if (constituencyId) {
      fetchWards(constituencyId);
      fetchWardStats(constituencyId);
    } else {
      setWardStats([]);
    }
  };

  const handleWardChange = (wardId) => {
    handleFilterChange('ward_id', wardId);
    handleFilterChange('polling_station_id', '');
    setPollingStations([]);
    if (wardId) {
      fetchPollingStations(wardId);
      fetchPollingStationStats(wardId);
    } else {
      setPollingStationStats([]);
    }
  };

  const handlePollingStationChange = (pollingStationId) => {
    handleFilterChange('polling_station_id', pollingStationId);
  };

  const handleSearch = (e) => {
    handleFilterChange('q', e.target.value);
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sort: field,
      order: prev.sort === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handlePageChange = (page) => {
    fetchVoters(page);
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/admin/voters/export?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voters-export-${Date.now()}.csv`;
      a.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const viewVoterDetails = async (voter) => {
    setSelectedVoter(voter);
    try {
      const data = await apiRequest(`/admin/verification-logs?user_id=${voter.id}&limit=50`);
      setVerificationLogs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const getStatusBadge = (voter) => {
    if (voter.is_verified) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified</span>;
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</span>;
  };

  const getBiometricBadge = (voter) => {
    if (voter.is_biometric_enrolled) {
      const badges = [];
      if (voter.face_enrolled) badges.push(<span key="face" className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">📷 Face</span>);
      if (voter.fingerprint_enrolled) badges.push(<span key="fp" className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">👆 Fingerprint</span>);
      return <div className="flex gap-1">{badges}</div>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">None</span>;
  };

  const SortIcon = ({ field }) => {
    if (filters.sort !== field) return <ChevronDown className="w-4 h-4 text-gray-400" />;
    return filters.order === 'desc' ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading && voters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-black" />
            <h1 className="text-xl font-bold text-black">IEBC Admin</h1>
            <span className="px-2 py-1 bg-black text-white rounded-full text-xs font-medium">Voter Registry</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.full_name}</span>
            <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="px-3 py-1 text-sm text-red-600 hover:text-red-700">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 py-6">
        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <MetricCard icon={Users} label="Total Voters" value={formatNumber(metrics.total)} color="blue" />
            <MetricCard icon={CheckCircle} label="Verified" value={formatNumber(metrics.verified)} color="green" subLabel={`${metrics.verification_rate}%`} />
            <MetricCard icon={Shield} label="Biometric Enrolled" value={formatNumber(metrics.biometric_enrolled)} color="purple" subLabel={`${metrics.biometric_rate}%`} />
            <MetricCard icon={<span className="text-xl">📷</span>} label="Face Enrolled" value={formatNumber(metrics.face_enrolled)} color="blue" />
            <MetricCard icon={<span className="text-xl">👆</span>} label="Fingerprint Enrolled" value={formatNumber(metrics.fingerprint_enrolled)} color="green" />
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, ID, phone, email..."
                  value={filters.q}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                className={`px-4 py-2 border border-gray-300 rounded-lg font-medium flex items-center gap-2 ${filterPanelOpen ? 'bg-blue-50 text-blue-700 border-blue-300' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className="w-5 h-5" /> Filters
              </button>
              <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
                <Download className="w-5 h-5" /> Export CSV
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {filterPanelOpen && (
            <div className="p-4 border-t border-gray-100 animate-slide-down">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <SelectFilter
                  label="County"
                  value={filters.county_id}
                  options={counties}
                  onChange={handleCountyChange}
                  placeholder="All Counties"
                />
                <SelectFilter
                  label="Constituency"
                  value={filters.constituency_id}
                  options={constituencies}
                  onChange={handleConstituencyChange}
                  placeholder="All Constituencies"
                  disabled={!filters.county_id}
                />
                <SelectFilter
                  label="Ward"
                  value={filters.ward_id}
                  options={wards}
                  onChange={handleWardChange}
                  placeholder="All Wards"
                  disabled={!filters.constituency_id}
                />
                <SelectFilter
                  label="Polling Station"
                  value={filters.polling_station_id}
                  options={pollingStations}
                  onChange={handlePollingStationChange}
                  placeholder="All Stations"
                  disabled={!filters.ward_id}
                />
                <SelectFilter
                  label="Sex"
                  value={filters.sex}
                  options={SEX_OPTIONS.map(v => ({ id: v, name: v || 'All' }))}
                  onChange={(v) => handleFilterChange('sex', v)}
                  placeholder="All"
                />
                <SelectFilter
                  label="Verification"
                  value={filters.is_verified}
                  options={STATUS_OPTIONS}
                  onChange={(v) => handleFilterChange('is_verified', v)}
                  placeholder="All"
                />
              </div>
              <div className="mt-4 flex items-center gap-4">
                <SelectFilter
                  label="Biometric"
                  value={filters.has_biometric}
                  options={BIOMETRIC_OPTIONS}
                  onChange={(v) => handleFilterChange('has_biometric', v)}
                  placeholder="All"
                  className="w-48"
                />
                <button onClick={() => setFilters({ ...filters, q: '', county_id: '', constituency_id: '', ward_id: '', polling_station_id: '', is_verified: '', has_biometric: '', sex: '', sort: 'created_at', order: 'desc' })} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Clear All</button>
              </div>
            </div>
          )}
        </div>

        {/* Hierarchy Stats Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-100">
            <nav className="flex gap-4 px-4" aria-label="Hierarchy stats">
              <StatTab label="Counties" data={countyStats} />
              <StatTab label="Constituencies" data={constituencyStats} />
              <StatTab label="Wards" data={wardStats} />
              <StatTab label="Polling Stations" data={pollingStationStats} />
            </nav>
          </div>
        </div>

        {/* Voters Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('full_name')} className="flex items-center gap-1 hover:text-blue-600">Name <SortIcon field="full_name" /></button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('id_number')} className="flex items-center gap-1 hover:text-blue-600">ID Number <SortIcon field="id_number" /></button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">County / Constituency / Ward</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Polling Station</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Verification</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Biometric</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Registered</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></td></tr>
                ) : voters.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No voters found matching your criteria</td></tr>
                ) : (
                  voters.map(voter => (
                    <tr key={voter.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => viewVoterDetails(voter)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{voter.full_name}</div>
                        <div className="text-xs text-gray-500">{voter.sex} • {voter.date_of_birth ? formatDate(voter.date_of_birth) : ''}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{voter.id_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{voter.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        <div>{voter.counties?.name}</div>
                        <div className="text-xs">{voter.constituencies?.name}</div>
                        <div className="text-xs">{voter.wards?.name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">{voter.polling_station_name}</td>
                      <td className="px-4 py-3">{getStatusBadge(voter)}</td>
                      <td className="px-4 py-3">{getBiometricBadge(voter)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(voter.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={(e) => { e.stopPropagation(); viewVoterDetails(voter); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {formatNumber(pagination.total)} voters
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">Previous</button>
                <span className="px-3 py-1 text-sm font-medium">Page {pagination.page} of {pagination.totalPages}</span>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voter Detail Modal */}
      {selectedVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedVoter(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedVoter.full_name}</h2>
                <p className="text-sm text-gray-500">ID: {selectedVoter.id_number} • {selectedVoter.sex}</p>
              </div>
              <button onClick={() => setSelectedVoter(null)} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow label="Phone" value={selectedVoter.phone} icon={Phone} />
                <DetailRow label="Email" value={selectedVoter.email || '—'} icon={Mail} />
                <DetailRow label="Date of Birth" value={selectedVoter.date_of_birth ? formatDate(selectedVoter.date_of_birth) : '—'} icon={Calendar} />
                <DetailRow label="Sex" value={selectedVoter.sex} icon={User} />
                <DetailRow label="County" value={selectedVoter.counties?.name} icon={MapPin} />
                <DetailRow label="Constituency" value={selectedVoter.constituencies?.name} icon={Building2} />
                <DetailRow label="Ward" value={selectedVoter.wards?.name} icon={MapPin} />
                <DetailRow label="Polling Station" value={selectedVoter.polling_station_name} icon={Building2} />
                <DetailRow label="Verified" value={selectedVoter.is_verified ? 'Yes' : 'No'} icon={selectedVoter.is_verified ? CheckCircle : XCircle} />
                <DetailRow label="Biometric Enrolled" value={selectedVoter.is_biometric_enrolled ? 'Yes' : 'No'} icon={Shield} />
                <DetailRow label="Face" value={selectedVoter.face_enrolled ? 'Enrolled' : 'Not enrolled'} icon={<span className="text-xl">📷</span>} />
                <DetailRow label="Fingerprint" value={selectedVoter.fingerprint_enrolled ? 'Enrolled' : 'Not enrolled'} icon={<span className="text-xl">👆</span>} />
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Verification History</h3>
                {verificationLogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No verification logs found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-gray-500"><th className="pb-2">Date</th><th className="pb-2">Method</th><th className="pb-2">Status</th><th className="pb-2">Score</th><th className="pb-2">Device</th></tr></thead>
                      <tbody>
                        {verificationLogs.map(log => (
                          <tr key={log.id} className="border-t border-gray-100">
                            <td className="py-2">{formatDate(log.created_at)}</td>
                            <td className="py-2 capitalize">{log.method}</td>
                            <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span></td>
                            <td className="py-2">{log.score ? (log.score * 100).toFixed(1) + '%' : '—'}</td>
                            <td className="py-2 text-gray-500">{log.device_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
      `}</style>
    </div>
  );
}

function MetricCard({ icon, label, value, color, subLabel }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  };
  return (
    <div className={`p-4 rounded-xl border ${colors[color] || colors.blue}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subLabel && <p className="text-xs font-medium mt-1">{subLabel}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: color === 'blue' ? '#dbeafe' : color === 'green' ? '#dcfce7' : '#f3e8ff' }}>
          {typeof icon === 'function' ? <icon className="w-6 h-6" /> : icon}
        </div>
      </div>
    </div>
  );
}

function SelectFilter({ label, value, options, onChange, placeholder, disabled, className }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
      </select>
    </div>
  );
}

function StatTab({ label, data }) {
  return (
    <button className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300">
      {label} <span className="ml-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs">{data?.length || 0}</span>
    </button>
  );
}

function DetailRow({ label, value, icon }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="w-8 h-8 flex items-center justify-center text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}