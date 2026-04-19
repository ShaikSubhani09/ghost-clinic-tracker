import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Analytics() {
  const [statusData, setStatusData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [insights, setInsights] = useState({ topIssue: 'None', peakDay: 'None' });
  const [loading, setLoading] = useState(true);

  const COLORS = {
    'Open': '#16a34a',
    'Closed': '#dc2626',
    'No Doctor': '#f59e0b',
    'No Medicine': '#2563eb'
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'reports'), (snapshot) => {
      const counts = { 'Open': 0, 'Closed': 0, 'No Doctor': 0, 'No Medicine': 0 };
      const days = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
      
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Count Statuses
        if (counts[data.status] !== undefined) {
          counts[data.status]++;
        } else {
           counts[data.status] = 1;
        }

        // Count Days
        if (data.timestamp && data.timestamp.toDate) {
          const date = data.timestamp.toDate();
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          if(days[dayName] !== undefined) days[dayName]++;
        }
      });

      // Format Pie Data
      const newStatusData = Object.keys(counts)
        .filter(key => counts[key] > 0)
        .map(key => ({ name: key, value: counts[key] }));
      
      setStatusData(newStatusData);

      // Format Bar Data (in standard week order)
      const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const newTrendData = weekOrder.map(day => ({ name: day, reports: days[day] }));
      setTrendData(newTrendData);

      // Calculate Insights
      let topIssue = 'None';
      let maxIssueCount = 0;
      ['Closed', 'No Doctor', 'No Medicine'].forEach(issue => {
         if (counts[issue] > maxIssueCount) {
             maxIssueCount = counts[issue];
             topIssue = issue;
         }
      });
      if (maxIssueCount === 0) topIssue = 'No issues reported!';

      let peakDay = 'None';
      let maxDayCount = 0;
      weekOrder.forEach(day => {
         if (days[day] > maxDayCount) {
             maxDayCount = days[day];
             peakDay = day;
         }
      });
      if (maxDayCount === 0) peakDay = 'No reports yet';

      setInsights({ topIssue, peakDay });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
     return <div className="p-8 text-center text-gray-500">Loading live analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart */}
        <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Distribution</h3>
          <div className="h-64">
            {statusData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={statusData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={80}
                     fill="#8884d8"
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {statusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9ca3af'} />
                     ))}
                   </Pie>
                   <Tooltip />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
            ) : (
               <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 shadow-sm rounded-xl border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reports over time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                />
                <Bar dataKey="reports" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Insights */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
         <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
         <ul className="space-y-3">
           <li className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
             <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
             Most reported issue: <span className="font-semibold ml-1 text-red-700">{insights.topIssue}</span>
           </li>
           <li className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
             <span className="h-2 w-2 bg-blue-500 rounded-full mr-3"></span>
             Peak reporting day: <span className="font-semibold ml-1 text-blue-700">{insights.peakDay}</span>
           </li>
         </ul>
      </div>

    </div>
  );
}
