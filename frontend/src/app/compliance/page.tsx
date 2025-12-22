'use client';

import { Header } from '../../components/layout/Header';

export default function CompliancePage() {
  return (
    <div>
      <Header title="Compliance" />
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Compliance Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Manage compliance reviews and regulatory requirements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm font-medium text-gray-600">Completed This Month</p>
            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-sm font-medium text-gray-600">Overdue Items</p>
            <p className="text-3xl font-bold text-red-600 mt-2">0</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
          <div className="text-center text-gray-500 py-8">
            No compliance reviews to display.
          </div>
        </div>
      </div>
    </div>
  );
}
