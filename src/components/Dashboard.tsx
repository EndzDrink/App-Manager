import React from 'react';
import AppCard from './AppCard';
import AddAppCard from './AddAppCard';
import { DashboardHeader } from './DashboardHeader';
import { DashboardTabs } from './DashboardTabs';

const MetricsCard = ({ title, value, description }) => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);

const WeeklyUsageChart = () => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 col-span-2">
    <div className="flex items-center space-x-2 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M18.7 8.3L12 15 7.1 10.1" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900">Weekly Usage</h3>
    </div>
    <p className="text-sm text-gray-500 mb-4">App usage throughout the week</p>
    <div className="space-y-4">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
        <div key={day} className="flex items-center">
          <span className="w-10 text-sm text-gray-500">{day}</span>
          <div className="flex-grow bg-gray-200 h-2 rounded-full mx-4">
            <div className="bg-gray-900 h-full rounded-full" style={{ width: `${Math.random() * 80 + 20}%` }}></div>
          </div>
          <span className="text-sm text-gray-500">{Math.floor(Math.random() * 10)}h {Math.floor(Math.random() * 60)}m</span>
        </div>
      ))}
    </div>
  </div>
);

const UsageByCategoryChart = () => (
  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 col-span-1">
    <div className="flex items-center space-x-2 mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20" />
      </svg>
      <h3 className="text-lg font-semibold text-gray-900">Usage by Category</h3>
    </div>
    <p className="text-sm text-gray-500 mb-4">Weekly minutes by app category</p>
    <div className="space-y-4">
      {['Entertainment', 'Productivity', 'Games', 'Communication', 'Utilities'].map(category => (
        <div key={category} className="flex items-center">
          <span className="w-24 text-sm text-gray-500">{category}</span>
          <div className="flex-grow bg-gray-200 h-2 rounded-full mx-4">
            <div className="bg-gray-900 h-full rounded-full" style={{ width: `${Math.random() * 80 + 20}%` }}></div>
          </div>
          <span className="text-sm text-gray-500">{Math.floor(Math.random() * 10)}h {Math.floor(Math.random() * 60)}m</span>
        </div>
      ))}
    </div>
  </div>
);


const dummyApps = [
  { id: 1, appName: 'ChatApp', description: 'Real-time communication platform.', status: 'active' },
  { id: 2, appName: 'GameHub', description: 'Collection of online games.', status: 'inactive' },
];

const dummySubscriptions = [
  { id: 1, subscriptionName: 'Cloud Storage Pro', cost: 9.99, renewalDate: '2025-09-15' },
  { id: 2, subscriptionName: 'Design Suite', cost: 24.99, renewalDate: '2025-10-22' },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const handleAddApp = () => {
    console.log('Add App button clicked!');
  };

  const handleAddSubscription = () => {
    console.log('Add Subscription button clicked!');
  };

  return (
    <div className="p-8 font-inter">
      {activeTab !== 'admin' && <DashboardHeader />}
      
      {/* Content for the active tab */}
      {activeTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard title="Total Apps" value="5" description="4 active • 1 unused" />
            <MetricsCard title="Subscriptions" value="4" description="3 actively used" />
            <MetricsCard title="Monthly Cost" value="ZAR 108.96" description="ZAR 1307.52 yearly" />
            <MetricsCard title="Recommendations" value="2" description="Optimization suggestions" />
          </div>

          <DashboardTabs activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <WeeklyUsageChart />
              <UsageByCategoryChart />
            </div>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Your Applications</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {dummyApps.map(app => (
                <AppCard key={app.id} appName={app.appName} description={app.description} status={app.status as any} />
              ))}
              <AddAppCard onClick={handleAddApp} />
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Your Subscriptions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
