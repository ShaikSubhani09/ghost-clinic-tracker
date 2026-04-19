import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Home, User, Edit2, Save, X } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Statistics
  const [stats, setStats] = useState({ total: 0, closed: 0, issues: 0, active: 0 });

  useEffect(() => {
    // Populate profile form values uniquely once currentUser is loaded
    if (currentUser) {
       setDisplayName(currentUser.displayName || '');
    }

    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    
    // Listen for realtime updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportsArray = [];
      let total = 0;
      let closed = 0;
      let issues = 0;
      let active = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let timeString = 'Just now';
        
        if (data.timestamp?.toDate) {
            const date = data.timestamp.toDate();
            timeString = date.toLocaleString();
        }

        reportsArray.push({
          id: doc.id,
          clinic: data.clinicName || 'Unknown',
          location: data.location || 'Unknown',
          status: data.status || 'Unknown',
          time: timeString
        });

        total++;
        if (data.status === 'Closed') closed++;
        else if (data.status === 'No Doctor' || data.status === 'No Medicine') issues++;
        else if (data.status === 'Open') active++;
      });

      setReports(reportsArray);
      setStats({ total, closed, issues, active });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
      e.preventDefault();
      setIsUpdating(true);
      try {
         await updateProfile(auth.currentUser, {
            displayName: displayName
         });
         setIsEditing(false);
      } catch (error) {
         console.error("Error updating profile", error);
         alert("Failed to update profile.");
      }
      setIsUpdating(false);
  }

  const cards = [
    { title: 'Total Reports', value: stats.total, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Closed Clinics', value: stats.closed, icon: Home, color: 'text-red-500', bg: 'bg-red-100' },
    { title: 'Issues Found', value: stats.issues, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { title: 'Active Clinics', value: stats.active, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Open</span>;
      case 'Closed':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Closed</span>;
      default:
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      
      {/* LEFT COLUMN: User Profile Sidebar */}
      <div className="w-full lg:w-1/4 bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden sticky top-24">
         <div className="bg-primary px-4 py-8 flex flex-col items-center">
            <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center p-2 shadow-lg mb-3">
               <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-white text-center">
               {currentUser?.displayName || 'No Name Set'}
            </h3>
            <p className="text-sm text-blue-100 text-center">{currentUser?.email}</p>
         </div>

         <div className="p-5">
            <div className="flex justify-between items-center mb-4">
               <h4 className="font-semibold text-gray-900 border-b-2 border-gray-100 pb-1 w-full flex justify-between">
                 Basic Details
                 {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-primary transition-colors">
                       <Edit2 className="w-4 h-4" />
                    </button>
                 )}
               </h4>
            </div>

            {isEditing ? (
               <form onSubmit={handleUpdateProfile} className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Display Name</label>
                    <input 
                      type="text" 
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2" 
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="flex space-x-2 pt-2">
                     <button 
                        type="submit" 
                        disabled={isUpdating}
                        className="flex-1 flex justify-center items-center py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:opacity-50"
                     >
                        {isUpdating ? 'Saving...' : <><Save className="w-4 h-4 mr-1" /> Save</>}
                     </button>
                     <button 
                        type="button" 
                        onClick={() => { setIsEditing(false); setDisplayName(currentUser?.displayName || ''); }}
                        className="flex-1 justify-center items-center py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex"
                     >
                        <X className="w-4 h-4 mr-1" /> Cancel
                     </button>
                  </div>
               </form>
            ) : (
               <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900 font-medium">{currentUser?.displayName || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">Role</p>
                    <p className="text-sm text-gray-900 font-medium">Community Member</p>
                  </div>
               </div>
            )}
         </div>
      </div>


      {/* RIGHT COLUMN: Dashboard Core */}
      <div className="w-full lg:w-3/4 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-100 transition hover:shadow-md">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 rounded-md p-3 ${card.bg}`}>
                      <Icon className={`h-6 w-6 ${card.color}`} aria-hidden="true" />
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">{card.title}</dt>
                        <dd>
                          <div className="text-2xl font-bold text-gray-900">{loading ? '...' : card.value}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recents Table */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          <div className="px-5 py-5 sm:px-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
            <h3 className="text-lg leading-6 font-bold text-gray-900">Recently Reported Clinics (Live)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Clinic Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reports.length === 0 && !loading && (
                  <tr>
                     <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                        No reports yet! Go to the Report Clinic tab to submit one.
                     </td>
                  </tr>
                )}
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{report.clinic}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{report.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
