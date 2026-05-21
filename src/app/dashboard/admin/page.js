'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { showToast } from '@/components/ui/Toast';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchRequests();
      }
    }
  }, [status, session, router]);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/admin/requests');
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast(`Request ${action} successfully`);
      fetchRequests();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  if (status === 'loading' || loading) return <div className="animate-pulse">Loading Admin Panel...</div>;
  if (session?.user?.role !== 'admin') return null;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-danger" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-100 mb-1">Admin Dashboard</h1>
          <p className="text-sm text-surface-400">Manage plan upgrade requests and users.</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Pending Plan Requests</h2>
        
        {requests.length === 0 ? (
          <p className="text-sm text-surface-400 py-8 text-center">No pending requests.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Current Plan</th>
                  <th>Requested Plan</th>
                  <th>UPI ID</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id}>
                    <td>{req.userId?.name}</td>
                    <td className="text-primary-300">{req.userId?.email}</td>
                    <td><span className="badge badge-neutral">{req.userId?.plan}</span></td>
                    <td><span className="badge badge-primary">{req.plan}</span></td>
                    <td className="font-mono text-xs">{req.upiId}</td>
                    <td className="text-xs text-surface-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(req._id, 'approved')}
                          className="btn btn-sm btn-ghost text-success hover:bg-success/10"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleAction(req._id, 'rejected')}
                          className="btn btn-sm btn-ghost text-danger hover:bg-danger/10"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
