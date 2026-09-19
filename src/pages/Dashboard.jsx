import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [regionalSales, setRegionalSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
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

      // Extract KPI record (either single object or first row in array)
      const kpiData = Array.isArray(kpisRes.data) ? kpisRes.data[0] || {} : kpisRes.data || {};
      console.log("KPIs from Supabase:", kpiData);
      setKpis(kpiData);

      // Normalize monthly sales data keys if needed
      const normalizedMonthly = (monthlyRes.data || []).map((item) => ({
        ...item,
        month: item.month || item.order_month || item.sales_month || 'N/A',
        revenue: Number(item.revenue ?? item.total_sales ?? item.sales ?? 0),
      }));
      setMonthlySales(normalizedMonthly);

      // Normalize top products data keys if needed
      const normalizedProducts = (productsRes.data || []).map((item) => ({
        ...item,
        product_name: item.product_name || item.name || 'Unknown',
        revenue: Number(item.revenue ?? item.total_sales ?? item.sales ?? 0),
      }));
      setTopProducts(normalizedProducts);

      // Normalize regional sales data keys if needed
      const normalizedRegional = (regionalRes.data || []).map((item) => ({
        ...item,
        region: item.region || 'Unknown',
        revenue: Number(item.revenue ?? item.total_sales ?? item.sales ?? 0),
      }));
      setRegionalSales(normalizedRegional);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
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

  const formatNumber = (val) => {
    const num = Number(val) || 0;
    return num.toLocaleString('en-US');
  };

  const revenueDisplay = formatCurrency(kpis?.total_revenue ?? kpis?.revenue ?? kpis?.sales ?? 0);
  const profitDisplay = formatCurrency(kpis?.total_profit ?? kpis?.profit ?? 0);
  const marginDisplay = `${Number(kpis?.profit_margin || 0).toFixed(2)}%`;
  const ordersDisplay = formatNumber(kpis?.total_orders ?? kpis?.orders ?? kpis?.order_count ?? 0);
  const aovDisplay = formatCurrency(kpis?.avg_order_value ?? 0);

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, color: '#1a1a1a' }}>Sales Performance Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Logout
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading && !kpis ? (
        <div>Loading dashboard data...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Total Revenue</div>
              <div style={cardValueStyle}>{revenueDisplay}</div>
            </div>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Total Profit</div>
              <div style={cardValueStyle}>{profitDisplay}</div>
            </div>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Profit Margin</div>
              <div style={cardValueStyle}>{marginDisplay}</div>
            </div>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Total Orders</div>
              <div style={cardValueStyle}>{ordersDisplay}</div>
            </div>
            <div style={cardStyle}>
              <div style={cardTitleStyle}>Avg Order Value</div>
              <div style={cardValueStyle}>{aovDisplay}</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            {/* Monthly Sales Line Chart */}
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Monthly Sales Trend</h3>
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySales} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#007bff" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
              {/* Top Products Horizontal Bar Chart */}
              <div style={chartCardStyle}>
                <h3 style={chartTitleStyle}>Top Products by Revenue</h3>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={topProducts}
                      margin={{ top: 10, right: 30, left: 60, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="product_name"
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#28a745" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Regional Sales Bar Chart */}
              <div style={chartCardStyle}>
                <h3 style={chartTitleStyle}>Regional Sales</h3>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalSales} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#17a2b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  border: '1px solid #e9ecef',
};

const cardTitleStyle = {
  fontSize: '14px',
  color: '#6c757d',
  marginBottom: '8px',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const cardValueStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#212529',
};

const chartCardStyle = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  border: '1px solid #e9ecef',
};

const chartTitleStyle = {
  marginTop: 0,
  marginBottom: '16px',
  fontSize: '16px',
  fontWeight: '600',
  color: '#343a40',
};
