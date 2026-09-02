import { useEffect, useState } from 'react';
import { adminGetUsers } from '../api';
import { Link } from 'react-router-dom';
import { Users, Shield, ArrowRight, User } from 'lucide-react';
import { STRINGS } from '../constants/strings';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetUsers().then(data => {
      setUsers(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={24} className="text-indigo-500" />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{STRINGS.ADMIN_DASHBOARD.TITLE}</h1>
          </div>
          <p className="text-slate-500">{STRINGS.ADMIN_DASHBOARD.SUBTITLE}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{STRINGS.ADMIN_DASHBOARD.PLATFORM_USERS}</h2>
          </div>
          <div className="bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1 rounded-full">
            {users.length} {STRINGS.ADMIN_DASHBOARD.TOTAL}
          </div>
        </div>
        
        {users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {STRINGS.ADMIN_DASHBOARD.NO_USERS}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">{STRINGS.ADMIN_DASHBOARD.COL_NAME}</th>
                  <th className="p-4 font-medium">{STRINGS.ADMIN_DASHBOARD.COL_EMAIL}</th>
                  <th className="p-4 font-medium">{STRINGS.ADMIN_DASHBOARD.COL_ROLE}</th>
                  <th className="p-4 font-medium">{STRINGS.ADMIN_DASHBOARD.COL_JOINED}</th>
                  <th className="p-4 font-medium text-right">{STRINGS.ADMIN_DASHBOARD.COL_ACTIONS}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <User size={16} />
                        </div>
                        <span className="font-medium text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {u.role === 'CLIENT' && (
                        <Link to={`/admin/user/${u.id}`} className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                          {STRINGS.ADMIN_DASHBOARD.VIEW_DETAILS} <ArrowRight size={14} className="ml-1" />
                        </Link>
                      )}
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
