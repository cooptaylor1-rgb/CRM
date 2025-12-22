'use client';

import { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { householdsService } from '../../services/households.service';
import { accountsService } from '../../services/accounts.service';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalHouseholds: 0,
    totalAum: 0,
    activeAccounts: 0,
    pendingReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [households, accounts] = await Promise.all([
          householdsService.getHouseholds(),
          accountsService.getAccounts(),
        ]);

        const totalAum = households.reduce(
          (sum, h) => sum + Number(h.totalAum || 0),
          0
        );
        const activeAccounts = accounts.filter(
          (a) => a.status === 'open'
        ).length;

        setStats({
          totalHouseholds: households.length,
          totalAum,
          activeAccounts,
          pendingReviews: 0, // TODO: Fetch from compliance service
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Households */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Households
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalHouseholds}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-3xl">🏠</span>
              </div>
            </div>
          </div>

          {/* Total AUM */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total AUM</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalAum)}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </div>

          {/* Active Accounts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Accounts
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeAccounts}
                </p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-3xl">💼</span>
              </div>
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Reviews
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingReviews}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-3xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="text-gray-600">
            <p>No recent activity to display.</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-primary">
              + New Household
            </button>
            <button className="btn btn-primary">
              + New Account
            </button>
            <button className="btn btn-primary">
              📊 Run Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
