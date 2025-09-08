import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  avgDuration: number;
  providers: string[];
  models: string[];
  operationTypes: string[];
  dailyBreakdown: Record<string, { requests: number; cost: number; tokens: number }>;
  hourlyBreakdown: Record<string, { requests: number; cost: number; tokens: number }>;
  providerBreakdown: Record<string, { requests: number; cost: number; tokens: number; successRate: number }>;
  modelBreakdown: Record<string, { requests: number; cost: number; tokens: number; avgDuration: number }>;
  operationBreakdown: Record<string, { requests: number; cost: number; tokens: number; successRate: number }>;
}

interface RecentUsage {
  id: string;
  provider: string;
  model: string;
  operation_type: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  request_duration_ms: number;
  success: boolean;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

const AIUsageSection: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [recentUsage, setRecentUsage] = useState<RecentUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');

  const fetchUsageStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (timeframe) params.append('timeframe', timeframe);
      if (selectedProvider) params.append('provider', selectedProvider);
      if (selectedModel) params.append('model', selectedModel);

      const response = await axios.get(`${BACKEND_URL}/api/admin/ai-usage-stats?${params}`);
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch usage statistics');
      }
    } catch (err: any) {
      console.error('Error fetching usage stats:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch usage statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentUsage = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      if (selectedProvider) params.append('provider', selectedProvider);
      if (selectedModel) params.append('model', selectedModel);

      const response = await axios.get(`${BACKEND_URL}/api/admin/ai-usage-recent?${params}`);
      
      if (response.data.success) {
        setRecentUsage(response.data.data);
      }
    } catch (err: any) {
      console.error('Error fetching recent usage:', err);
    }
  };

  useEffect(() => {
    fetchUsageStats();
    fetchRecentUsage();
  }, [timeframe, selectedProvider, selectedModel]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCostColor = (cost: number) => {
    if (cost < 1) return 'text-green-600';
    if (cost < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Usage Tracking</h3>
          <button
            onClick={() => {
              fetchUsageStats();
              fetchRecentUsage();
            }}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-2">
              Timeframe
            </label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              id="provider"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Models</option>
              {stats?.models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalRequests)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className={`text-2xl font-semibold ${getCostColor(stats.totalCost)}`}>
                  {formatCurrency(stats.totalCost)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                <p className="text-2xl font-semibold text-gray-900">{formatNumber(stats.totalTokens)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-semibold text-gray-900">{formatDuration(stats.avgDuration)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Breakdown */}
      {stats && stats.providers.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Provider Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.providers.map(provider => {
              const providerData = stats.providerBreakdown[provider];
              return (
                <div key={provider} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900 capitalize">{provider}</h5>
                    <span className={`text-sm font-medium ${getSuccessRateColor(providerData.successRate)}`}>
                      {providerData.successRate.toFixed(1)}% success
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Requests: {formatNumber(providerData.requests)}</p>
                    <p>Cost: <span className={getCostColor(providerData.cost)}>{formatCurrency(providerData.cost)}</span></p>
                    <p>Tokens: {formatNumber(providerData.tokens)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Breakdown */}
      {stats && stats.models.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Model Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.models.map(model => {
              const modelData = stats.modelBreakdown[model];
              return (
                <div key={model} className="p-4 border border-gray-200 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">{model}</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Requests: {formatNumber(modelData.requests)}</p>
                    <p>Cost: <span className={getCostColor(modelData.cost)}>{formatCurrency(modelData.cost)}</span></p>
                    <p>Tokens: {formatNumber(modelData.tokens)}</p>
                    <p>Avg Duration: {formatDuration(modelData.avgDuration)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Operation Breakdown */}
      {stats && stats.operationTypes.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Operation Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.operationTypes.map(operation => {
              const operationData = stats.operationBreakdown[operation];
              return (
                <div key={operation} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900 capitalize">{operation.replace('_', ' ')}</h5>
                    <span className={`text-sm font-medium ${getSuccessRateColor(operationData.successRate)}`}>
                      {operationData.successRate.toFixed(1)}% success
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Requests: {formatNumber(operationData.requests)}</p>
                    <p>Cost: <span className={getCostColor(operationData.cost)}>{formatCurrency(operationData.cost)}</span></p>
                    <p>Tokens: {formatNumber(operationData.tokens)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Usage */}
      {recentUsage.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Usage</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUsage.map((usage) => (
                  <tr key={usage.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(usage.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {usage.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {usage.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {usage.operation_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(usage.total_tokens)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(usage.cost_usd)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(usage.request_duration_ms)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usage.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {usage.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIUsageSection;
