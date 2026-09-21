import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Percent,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  LogOut,
  BarChart3,
  Calendar,
  Layers,
  MapPin,
  AlertCircle,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [regionalSales, setRegionalSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const navigate = useNavigate();

  const fetchData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      setError(null);

      const [kpisRes, monthlyRes, productsRes, regionalRes] = await Promise.all([
        supabase.from('v_kpis').select('*'),
        supabase.from('v_monthly_sales').select('*'),
        supabase.from('v_top_products').select('*'),
        supabase.from('v_regional_sales').select('*'),
      ]);

      if (kpisRes.error) throw kpisRes.error;
      if (monthlyRes.error) throw monthlyRes.error;
      if (productsRes.error) throw productsRes.error;
      if (regionalRes.error) throw regionalRes.error;

      // Extract KPI record
      const kpiData = Array.isArray(kpisRes.data) ? kpisRes.data[0] || {} : kpisRes.data || {};
      setKpis(kpiData);

      // Normalize monthly sales data keys
      const normalizedMonthly = (monthlyRes.data || []).map((item) => ({
        ...item,
        month: item.month || item.order_month || item.sales_month || 'N/A',
        revenue: Number(item.revenue ?? item.total_sales ?? item.sales ?? 0),
      }));
      setMonthlySales(normalizedMonthly);

      // Normalize top products data keys
      const normalizedProducts = (productsRes.data || []).map((item) => ({
        ...item,
        product_name: item.product_name || item.name || 'Unknown',
        revenue: Number(item.revenue ?? item.total_sales ?? item.sales ?? 0),
      }));
      setTopProducts(normalizedProducts);

      // Normalize regional sales data keys
      const normalizedRegional = (regionalRes.data || []).map((item) => ({
        ...item,
        region: item.region || 'Unknown',
        revenue: Number(item.revenue ?? item.total_sales ?? item.sales ?? 0),
      }));
      setRegionalSales(normalizedRegional);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // 30-second polling interval
    const intervalId = setInterval(() => {
      fetchData();
    }, 30000);

    // Supabase Realtime subscription to fact_sales table
    const salesChannel = supabase
      .channel('fact_sales_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fact_sales' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(salesChannel);
    };
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Safe KPI values and formatters
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCompactCurrency = (val) => {
    const num = Number(val) || 0;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
    return `$${num.toFixed(0)}`;
  };

  const formatNumber = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-US');
  };

  const revenueDisplay = formatCurrency(kpis?.total_revenue ?? kpis?.revenue ?? kpis?.sales ?? 0);
  const profitDisplay = formatCurrency(kpis?.total_profit ?? kpis?.profit ?? 0);
  const marginDisplay = `${Number(kpis?.profit_margin || 0).toFixed(2)}%`;
  const ordersDisplay = formatNumber(kpis?.total_orders ?? kpis?.orders ?? kpis?.order_count ?? 0);
  const aovDisplay = formatCurrency(kpis?.avg_order_value ?? 0);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={customTooltipStyle}>
          <p style={tooltipLabelStyle}>{label}</p>
          <div style={tooltipValueRow}>
            <span style={tooltipDotStyle} />
            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>
              {payload[0].name || 'Revenue'}:
            </span>
            <span style={{ color: '#38bdf8', fontWeight: '700', fontSize: '14px', marginLeft: '6px' }}>
              {formatCurrency(payload[0].value)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={dashboardContainerStyle}>
      {/* Top Navigation / Header */}
      <header style={headerWrapperStyle}>
        <div style={headerLeftStyle}>
          <div style={brandIconBadgeStyle}>
            <BarChart3 size={24} color="#38bdf8" />
          </div>
          <div>
            <div style={titleRowStyle}>
              <h1 style={headerTitleStyle}>Sales Performance Dashboard</h1>
              <span style={liveBadgeStyle}>
                <span className="pulse-dot" style={pulseDotStyle} />
                LIVE SYNC
              </span>
            </div>
            <p style={headerSubtitleStyle}>
              Enterprise Revenue, Margin & Regional Analytics • Last synced{' '}
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div style={headerRightStyle}>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            style={refreshButtonStyle}
            title="Refresh dashboard data"
          >
            <RefreshCw
              size={16}
              color="#38bdf8"
              className={refreshing ? 'animate-spin' : ''}
              style={{ marginRight: '6px' }}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button onClick={handleLogout} style={logoutButtonStyle} title="Sign Out">
            <LogOut size={16} color="#cbd5e1" style={{ marginRight: '6px' }} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div style={errorCardStyle} className="animate-fade-in">
          <AlertCircle size={20} color="#f87171" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', color: '#fca5a5', fontSize: '14px' }}>Data Fetch Error</strong>
            <span style={{ color: '#fecaca', fontSize: '13px' }}>{error}</span>
          </div>
          <button onClick={() => fetchData(true)} style={retryButtonStyle}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !kpis ? (
        <div style={loadingContainerStyle} className="animate-fade-in">
          <div style={loadingSpinnerBadge}>
            <RefreshCw size={28} color="#38bdf8" className="animate-spin" />
          </div>
          <h3 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '18px' }}>Loading Dashboard Metrics</h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Synchronizing real-time sales views from Supabase...</p>
        </div>
      ) : (
        <>
          {/* 5 KPI Metric Cards */}
          <section style={kpiGridStyle}>
            {/* Total Revenue */}
            <div style={kpiCardStyle} className="animate-fade-in">
              <div style={kpiTopRow}>
                <span style={kpiTitleStyle}>Total Revenue</span>
                <div style={kpiIconContainer}>
                  <DollarSign size={18} color="#38bdf8" />
                </div>
              </div>
              <div style={kpiValueStyle}>{revenueDisplay}</div>
              <div style={kpiMetaStyle}>
                <span style={kpiTagSky}>Verified Sales</span>
              </div>
            </div>

            {/* Total Profit */}
            <div style={kpiCardStyle} className="animate-fade-in">
              <div style={kpiTopRow}>
                <span style={kpiTitleStyle}>Total Profit</span>
                <div style={kpiIconContainer}>
                  <TrendingUp size={18} color="#38bdf8" />
                </div>
              </div>
              <div style={kpiValueStyle}>{profitDisplay}</div>
              <div style={kpiMetaStyle}>
                <span style={kpiTagSky}>Net Earnings</span>
              </div>
            </div>

            {/* Profit Margin */}
            <div style={kpiCardStyle} className="animate-fade-in">
              <div style={kpiTopRow}>
                <span style={kpiTitleStyle}>Profit Margin</span>
                <div style={kpiIconContainer}>
                  <Percent size={18} color="#38bdf8" />
                </div>
              </div>
              <div style={kpiValueStyle}>{marginDisplay}</div>
              <div style={kpiMetaStyle}>
                <span style={kpiTagSky}>Margin Ratio</span>
              </div>
            </div>

            {/* Total Orders */}
            <div style={kpiCardStyle} className="animate-fade-in">
              <div style={kpiTopRow}>
                <span style={kpiTitleStyle}>Total Orders</span>
                <div style={kpiIconContainer}>
                  <ShoppingBag size={18} color="#38bdf8" />
                </div>
              </div>
              <div style={kpiValueStyle}>{ordersDisplay}</div>
              <div style={kpiMetaStyle}>
                <span style={kpiTagSky}>Transactions</span>
              </div>
            </div>

            {/* Avg Order Value */}
            <div style={kpiCardStyle} className="animate-fade-in">
              <div style={kpiTopRow}>
                <span style={kpiTitleStyle}>Avg Order Value</span>
                <div style={kpiIconContainer}>
                  <CreditCard size={18} color="#38bdf8" />
                </div>
              </div>
              <div style={kpiValueStyle}>{aovDisplay}</div>
              <div style={kpiMetaStyle}>
                <span style={kpiTagSky}>AOV Target</span>
              </div>
            </div>
          </section>

          {/* Main Charts Section */}
          <main style={chartsGridContainer}>
            {/* Monthly Sales Trend (Area/Line Chart) */}
            <div style={chartCardStyle} className="animate-fade-in">
              <div style={chartHeaderStyle}>
                <div>
                  <div style={chartTitleWithIcon}>
                    <Calendar size={18} color="#38bdf8" />
                    <h2 style={chartTitleStyle}>Monthly Sales Trend</h2>
                  </div>
                  <p style={chartSubtitleStyle}>Historical revenue performance across recorded timeline</p>
                </div>
                <div style={chartBadgeStyle}>
                  <Activity size={13} color="#38bdf8" style={{ marginRight: '5px' }} />
                  <span>Timeline</span>
                </div>
              </div>

              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySales} margin={{ top: 12, right: 24, left: 16, bottom: 12 }}>
                    <defs>
                      <linearGradient id="skyBlueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1b2f56" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#1b2f56"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickLine={{ stroke: '#1b2f56' }}
                    />
                    <YAxis
                      stroke="#1b2f56"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickLine={{ stroke: '#1b2f56' }}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ color: '#cbd5e1', fontSize: '12px', paddingTop: '10px' }}
                      formatter={(val) => <span style={{ color: '#cbd5e1' }}>{val}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#skyBlueGradient)"
                      activeDot={{ r: 7, fill: '#38bdf8', stroke: '#070d18', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Split Row: Top Products & Regional Breakdown */}
            <div style={twoColumnsChartRow}>
              {/* Top Products Horizontal Bar Chart */}
              <div style={chartCardStyle} className="animate-fade-in">
                <div style={chartHeaderStyle}>
                  <div>
                    <div style={chartTitleWithIcon}>
                      <Layers size={18} color="#38bdf8" />
                      <h2 style={chartTitleStyle}>Top Products by Revenue</h2>
                    </div>
                    <p style={chartSubtitleStyle}>Highest generating inventory items</p>
                  </div>
                  <div style={chartBadgeStyle}>
                    <span>Products</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topProducts}
                      margin={{ top: 10, right: 24, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1b2f56" horizontal={false} />
                      <XAxis
                        type="number"
                        stroke="#1b2f56"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickLine={{ stroke: '#1b2f56' }}
                        tickFormatter={formatCompactCurrency}
                      />
                      <YAxis
                        type="category"
                        dataKey="product_name"
                        stroke="#1b2f56"
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                        tickLine={{ stroke: '#1b2f56' }}
                        width={130}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                        formatter={(val) => <span style={{ color: '#cbd5e1' }}>{val}</span>}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="#38bdf8"
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Regional Sales Bar Chart */}
              <div style={chartCardStyle} className="animate-fade-in">
                <div style={chartHeaderStyle}>
                  <div>
                    <div style={chartTitleWithIcon}>
                      <MapPin size={18} color="#38bdf8" />
                      <h2 style={chartTitleStyle}>Regional Sales</h2>
                    </div>
                    <p style={chartSubtitleStyle}>Geographical revenue distribution</p>
                  </div>
                  <div style={chartBadgeStyle}>
                    <span>Territory</span>
                  </div>
                </div>

                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionalSales}
                      margin={{ top: 10, right: 24, left: 16, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="regionalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#0284c7" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1b2f56" vertical={false} />
                      <XAxis
                        dataKey="region"
                        stroke="#1b2f56"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickLine={{ stroke: '#1b2f56' }}
                      />
                      <YAxis
                        stroke="#1b2f56"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickLine={{ stroke: '#1b2f56' }}
                        tickFormatter={formatCompactCurrency}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                        formatter={(val) => <span style={{ color: '#cbd5e1' }}>{val}</span>}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill="url(#regionalGradient)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

// ----------------- STYLES (Navy Background, Sky-Blue Accents, Monochrome Blue, White Text) -----------------

const dashboardContainerStyle = {
  minHeight: '100vh',
  backgroundColor: '#070d18',
  color: '#ffffff',
  padding: '24px 32px',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  boxSizing: 'border-box',
};

const headerWrapperStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
  marginBottom: '32px',
  paddingBottom: '20px',
  borderBottom: '1px solid #162648',
};

const headerLeftStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const brandIconBadgeStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  backgroundColor: 'rgba(56, 189, 248, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 16px rgba(56, 189, 248, 0.15)',
};

const titleRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const headerTitleStyle = {
  margin: 0,
  fontSize: '24px',
  fontWeight: '700',
  color: '#ffffff',
  letterSpacing: '-0.3px',
};

const liveBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.5px',
  color: '#38bdf8',
  backgroundColor: 'rgba(56, 189, 248, 0.12)',
  padding: '3px 9px',
  borderRadius: '20px',
  border: '1px solid rgba(56, 189, 248, 0.3)',
};

const pulseDotStyle = {
  width: '7px',
  height: '7px',
  borderRadius: '50%',
  backgroundColor: '#38bdf8',
};

const headerSubtitleStyle = {
  margin: '4px 0 0 0',
  fontSize: '13px',
  color: '#94a3b8',
};

const headerRightStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const refreshButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '9px 16px',
  backgroundColor: '#0f1a30',
  color: '#ffffff',
  border: '1px solid #1b2f56',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const logoutButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '9px 16px',
  backgroundColor: '#091224',
  color: '#cbd5e1',
  border: '1px solid #1b2f56',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const errorCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  padding: '14px 18px',
  backgroundColor: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.35)',
  borderRadius: '10px',
  marginBottom: '24px',
};

const retryButtonStyle = {
  padding: '6px 12px',
  backgroundColor: 'rgba(239, 68, 68, 0.2)',
  border: '1px solid rgba(239, 68, 68, 0.4)',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
};

const loadingContainerStyle = {
  textAlign: 'center',
  padding: '80px 20px',
  backgroundColor: '#0f1a30',
  borderRadius: '16px',
  border: '1px solid #1b2f56',
};

const loadingSpinnerBadge = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: 'rgba(56, 189, 248, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '20px',
};

const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '18px',
  marginBottom: '32px',
};

const kpiCardStyle = {
  backgroundColor: '#0f1a30',
  padding: '22px',
  borderRadius: '14px',
  border: '1px solid #1b2f56',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(56, 189, 248, 0.05)',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
};

const kpiTopRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '14px',
};

const kpiTitleStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.6px',
};

const kpiIconContainer = {
  width: '36px',
  height: '36px',
  borderRadius: '9px',
  backgroundColor: 'rgba(56, 189, 248, 0.12)',
  border: '1px solid rgba(56, 189, 248, 0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const kpiValueStyle = {
  fontSize: '26px',
  fontWeight: '800',
  color: '#ffffff',
  letterSpacing: '-0.5px',
  marginBottom: '10px',
};

const kpiMetaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const kpiTagSky = {
  fontSize: '11px',
  fontWeight: '600',
  color: '#38bdf8',
  backgroundColor: 'rgba(56, 189, 248, 0.1)',
  padding: '2px 8px',
  borderRadius: '4px',
  border: '1px solid rgba(56, 189, 248, 0.2)',
};

const chartsGridContainer = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const chartCardStyle = {
  backgroundColor: '#0f1a30',
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid #1b2f56',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
};

const chartHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '20px',
};

const chartTitleWithIcon = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '4px',
};

const chartTitleStyle = {
  margin: 0,
  fontSize: '17px',
  fontWeight: '700',
  color: '#ffffff',
};

const chartSubtitleStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#94a3b8',
};

const chartBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '11px',
  fontWeight: '600',
  color: '#7dd3fc',
  backgroundColor: '#091224',
  padding: '4px 10px',
  borderRadius: '6px',
  border: '1px solid #1b2f56',
};

const twoColumnsChartRow = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
  gap: '24px',
};

const customTooltipStyle = {
  backgroundColor: '#091224',
  border: '1px solid #38bdf8',
  borderRadius: '8px',
  padding: '10px 14px',
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
};

const tooltipLabelStyle = {
  margin: '0 0 6px 0',
  fontSize: '12px',
  fontWeight: '600',
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.4px',
};

const tooltipValueRow = {
  display: 'flex',
  alignItems: 'center',
};

const tooltipDotStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: '#38bdf8',
  marginRight: '6px',
};
