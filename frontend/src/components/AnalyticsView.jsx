import { FiBarChart2, FiPieChart } from 'react-icons/fi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsView = () => {
  const verdictData = [
    { name: 'VALID', value: 80, color: '#22C55E' },
    { name: 'SUSPICIOUS', value: 15, color: '#F59E0B' },
    { name: 'FORGED', value: 5, color: '#EF4444' },
  ];

  const forgeryTypes = [
    { name: 'Copy-Move', count: 45 },
    { name: 'Seal Mismatch', count: 25 },
    { name: 'No DB Record', count: 15 },
    { name: 'Signature', count: 10 },
    { name: 'Other', count: 5 },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Analytics & Insights</h2>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Verdict Breakdown Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiPieChart className="mr-3 text-emerald-500" />
            Verdict Breakdown
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={verdictData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {verdictData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Common Forgery Types Card */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <FiBarChart2 className="mr-3 text-blue-500" />
            Most Common Forgery Types
          </h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={forgeryTypes} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
