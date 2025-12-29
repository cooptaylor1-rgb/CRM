'use client';

import { useEffect, useState } from 'react';
import { Header } from '../../components/layout/Header';
import { analyticsService, AdvisorDashboard } from '../../services/analytics.service';
import Link from 'next/link';

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<AdvisorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await analyticsService.getDashboard();
        setDashboard(data);
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div>
        <Header title="Dashboard" />
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
          </div>
        </div>
      </div>
    );
  }

  const { overview, recentActivity, goals, topClients, upcomingMeetings, alerts } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Advisor Dashboard" />
      
      <div className="p-6 lg:p-8">
        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 flex items-center justify-between ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center">
                  <span className="mr-3">
                    {alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <span className="font-medium">{alert.message}</span>
                </div>
                {alert.count && (
                  <span className="text-sm font-bold">{alert.count}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/tasks"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <span className="mr-2">✓</span> View Tasks
          </Link>
          <Link
            href="/meetings"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <span className="mr-2">📅</span> Schedule Meeting
          </Link>
          <Link
            href="/pipeline"
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <span className="mr-2">🎯</span> View Pipeline
          </Link>
          <Link
            href="/households"
            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
          >
            <span className="mr-2">+</span> Add Household
          </Link>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Households</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{overview.totalHouseholds}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-2xl">🏠</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total AUM</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(overview.totalAum)}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">YTD Revenue</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(overview.ytdRevenue)}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(overview.pipelineValue)}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Progress */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Annual Goals Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Revenue</span>
                <span className="font-medium">{goals.revenueProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(goals.revenueProgress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(goals.revenueActual)} / {formatCurrency(goals.revenueTarget)}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Meetings</span>
                <span className="font-medium">{goals.meetingsProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(goals.meetingsProgress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {goals.meetingsActual} / {goals.meetingsTarget}
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">New Clients</span>
                <span className="font-medium">{goals.newClientsProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(goals.newClientsProgress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {goals.newClientsActual} / {goals.newClientsTarget}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">This Month&apos;s Activity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-blue-600">{recentActivity.tasksCompleted}</p>
                <p className="text-sm text-gray-600">Tasks Completed</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{recentActivity.meetingsCompleted}</p>
                <p className="text-sm text-gray-600">Meetings Held</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">{recentActivity.emailsSent}</p>
                <p className="text-sm text-gray-600">Emails Sent</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-orange-600">{recentActivity.newProspects}</p>
                <p className="text-sm text-gray-600">New Prospects</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overdue Tasks</span>
                <span className="font-medium text-red-600">{overview.tasksOverdue}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Meetings This Week</span>
                <span className="font-medium">{overview.meetingsThisWeek}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">Reviews Due</span>
                <span className="font-medium text-yellow-600">{overview.reviewsDue}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Meetings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Meetings</h2>
              <Link href="/meetings" className="text-sm text-blue-600 hover:text-blue-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{meeting.title}</p>
                    <p className="text-sm text-gray-500">{meeting.householdName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatDate(meeting.startTime)}</p>
                    <p className="text-xs text-gray-500 capitalize">{meeting.type.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Clients by AUM</h2>
            <Link href="/households" className="text-sm text-blue-600 hover:text-blue-700">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Household</th>
                  <th className="pb-3 font-medium text-right">AUM</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                  <th className="pb-3 font-medium text-right">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client) => (
                  <tr key={client.householdId} className="border-b border-gray-100 last:border-0">
                    <td className="py-3">
                      <Link href={`/households/${client.householdId}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {client.householdName}
                      </Link>
                    </td>
                    <td className="py-3 text-right font-medium">{formatCurrency(client.aum)}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(client.revenue)}</td>
                    <td className="py-3 text-right text-gray-500 text-sm">
                      {new Date(client.lastContact).toLocaleDateString()}
                    </td>
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
