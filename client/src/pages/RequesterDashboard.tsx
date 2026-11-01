import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Inbox,
  PlayCircle,
  CheckCircle2,
  Archive,
  PlusCircle,
  FileText,
  RefreshCw,
  ArrowRight,
  Clock,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface RequesterMetrics {
  myOpenTickets: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

interface RecentTicket {
  id: number;
  ticketNumber: string;
  summary: string;
  status: string;
  requestedPriority: string;
  updatedAt: string;
}

interface DrillDownLinks {
  myOpenTickets: string;
  inProgress: string;
  resolved: string;
  closed: string;
}

interface DashboardData {
  metrics: RequesterMetrics;
  recentTickets: RecentTicket[];
  drillDownLinks: DrillDownLinks;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  NEW:                   { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'New' },
  OPEN:                  { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', label: 'Open' },
  IN_PROGRESS:           { bg: '#F5F3FF', color: '#5B21B6', border: '#C4B5FD', label: 'In Progress' },
  WAITING_FOR_REQUESTER: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', label: 'Waiting' },
  RESOLVED:              { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', label: 'Resolved' },
  CLOSED:                { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', label: 'Closed' },
  REOPENED:              { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Reopened' },
  CANCELLED:             { bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB', label: 'Cancelled' },
};

const PRIORITY_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  LOW:      { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', label: 'Low' },
  MEDIUM:   { bg: '#FFFBEB', color: '#92400E', border: '#FCD34D', label: 'Medium' },
  HIGH:     { bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3', label: 'High' },
  CRITICAL: { bg: '#FEF2F2', color: '#7F1D1D', border: '#FCA5A5', label: 'Critical' },
};

const fmtDate = (iso: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const RequesterDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/dashboards/requester', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load dashboard data');
      const json = await res.json();
      const payload: DashboardData = json.data ?? json;
      setData({
        metrics: payload.metrics ?? { myOpenTickets: 0, inProgress: 0, resolved: 0, closed: 0 },
        recentTickets: payload.recentTickets ?? [],
        drillDownLinks: payload.drillDownLinks ?? {
          myOpenTickets: '/tickets?status=open-group',
          inProgress: '/tickets?status=IN_PROGRESS',
          resolved: '/tickets?status=RESOLVED',
          closed: '/tickets?status=CLOSED',
        },
      });
    } catch {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const metrics = data?.metrics ?? { myOpenTickets: 0, inProgress: 0, resolved: 0, closed: 0 };
  const recentTickets = data?.recentTickets ?? [];
  const links = data?.drillDownLinks ?? {
    myOpenTickets: '/tickets?status=open-group',
    inProgress: '/tickets?status=IN_PROGRESS',
    resolved: '/tickets?status=RESOLVED',
    closed: '/tickets?status=CLOSED',
  };

  const metricCards = [
    {
      id: 'card-my-open-tickets',
      label: 'My Open Tickets',
      count: metrics.myOpenTickets,
      description: 'Active & pending requests',
      icon: <Inbox size={24} color="#006B3C" />,
      link: links.myOpenTickets,
      accent: '#006B3C',
      bgLight: 'rgba(0, 107, 60, 0.08)',
    },
    {
      id: 'card-in-progress',
      label: 'In Progress',
      count: metrics.inProgress,
      description: 'Being actively handled',
      icon: <PlayCircle size={24} color="#5B21B6" />,
      link: links.inProgress,
      accent: '#5B21B6',
      bgLight: 'rgba(91, 33, 182, 0.08)',
    },
    {
      id: 'card-resolved',
      label: 'Resolved',
      count: metrics.resolved,
      description: 'Awaiting your confirmation',
      icon: <CheckCircle2 size={24} color="#16A34A" />,
      link: links.resolved,
      accent: '#16A34A',
      bgLight: 'rgba(22, 163, 74, 0.08)',
    },
    {
      id: 'card-closed',
      label: 'Closed',
      count: metrics.closed,
      description: 'Completed history',
      icon: <Archive size={24} color="#4B5563" />,
      link: links.closed,
      accent: '#4B5563',
      bgLight: 'rgba(75, 85, 99, 0.08)',
    },
  ];

  return (
    <div id="requester-dashboard-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── Greeting Banner ── */}
      <div
        id="dashboard-header-banner"
        style={{
          background: 'linear-gradient(135deg, #006B3C 0%, #0B7A46 100%)',
          borderRadius: '16px',
          padding: '2rem 2.5rem',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 20px rgba(0, 107, 60, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            <Sparkles size={16} /> Requester Service Portal
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Welcome, {user?.name || 'Requester'}!
          </h1>
          <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '1rem' }}>
            Here's the latest on your requests.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
          <button
            id="btn-refresh-dashboard"
            aria-label="Refresh Dashboard"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '10px',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'spin-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div
          role="alert"
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboard()}
            style={{
              background: '#991B1B',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading Skeleton / State ── */}
      {loading && !refreshing && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4].map(idx => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #E5E7EB',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F3F4F6', animation: 'pulse 1.4s ease-in-out infinite' }} />
                <span style={{ width: '50px', height: '36px', borderRadius: '6px', background: '#F3F4F6', animation: 'pulse 1.4s ease-in-out infinite' }} />
              </div>
              <span style={{ width: '70%', height: '16px', borderRadius: '4px', background: '#F3F4F6', animation: 'pulse 1.4s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Metric Cards Grid ── */}
      {(!loading || refreshing) && (
        <div
          id="requester-metrics-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {metricCards.map(card => (
            <div
              key={card.id}
              id={card.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(card.link)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(card.link);
                }
              }}
              aria-label={`${card.label}: ${card.count}. Click to filter requests.`}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '14px',
                padding: '1.5rem',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                outline: 'none',
              }}
              className="dashboard-metric-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: card.bgLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </div>
                <div
                  style={{
                    fontSize: '2.1rem',
                    fontWeight: 800,
                    color: '#1A1A1A',
                    lineHeight: 1,
                  }}
                >
                  {card.count}
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>
                  {card.label}
                </h2>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '12px' }}>
                  {card.description}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: card.accent,
                    paddingTop: '8px',
                    borderTop: '1px solid #F3F4F6',
                  }}
                >
                  <span>View all</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main Content Area ── */}
      {(!loading || refreshing) && (
        <div
          id="requester-main-content"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
            gap: '1.5rem',
            alignItems: 'start',
          }}
          className="dashboard-content-grid"
        >
          {/* Left Column: My Recent Tickets */}
          <div
            id="requester-recent-tickets-widget"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#006B3C" />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A' }}>
                  My Recent Tickets
                </h2>
              </div>
              <button
                id="btn-view-all-tickets-link"
                onClick={() => navigate('/tickets')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#006B3C',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                }}
              >
                <span>View all</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Ticket list / Empty state */}
            {recentTickets.length === 0 ? (
              <div
                id="empty-recent-tickets"
                style={{
                  padding: '3.5rem 1.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 107, 60, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#006B3C',
                  }}
                >
                  <Inbox size={28} />
                </div>
                <div style={{ fontWeight: 700, color: '#1A1A1A', fontSize: '1rem' }}>
                  No recent tickets found
                </div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem', maxWidth: '340px' }}>
                  You have not submitted any service requests yet or all requests are archived.
                </p>
                <button
                  onClick={() => navigate('/create-ticket')}
                  style={{
                    marginTop: '8px',
                    background: '#006B3C',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <PlusCircle size={16} /> Create your first ticket
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentTickets.map((t, i) => {
                  const s = STATUS_STYLES[t.status] ?? { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', label: t.status };
                  const p = PRIORITY_STYLES[t.requestedPriority] ?? { bg: '#F3F4F6', color: '#374151', border: '#D1D5DB', label: t.requestedPriority };

                  return (
                    <div
                      key={t.id}
                      id={`recent-ticket-item-${t.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate(`/tickets/${t.id}`);
                        }
                      }}
                      style={{
                        padding: '1.1rem 1.5rem',
                        borderBottom: i < recentTickets.length - 1 ? '1px solid #F3F4F6' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="recent-ticket-row"
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              color: '#006B3C',
                              backgroundColor: 'rgba(0, 107, 60, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {t.ticketNumber}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: s.bg,
                              color: s.color,
                              border: `1px solid ${s.border}`,
                            }}
                          >
                            {s.label}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: p.bg,
                              color: p.color,
                              border: `1px solid ${p.border}`,
                            }}
                          >
                            {p.label}
                          </span>
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.92rem',
                            color: '#1A1A1A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t.summary}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                          {fmtDate(t.updatedAt)}
                        </span>
                        <ChevronRight size={18} color="#9CA3AF" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Quick Actions */}
          <div
            id="requester-quick-actions-box"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #E5E7EB',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1A1A1A' }}>
              Quick Actions
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>
              Frequently used service actions for quick self-service navigation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                id="btn-quick-create-ticket"
                onClick={() => navigate('/create-ticket')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: '#006B3C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0, 107, 60, 0.2)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <PlusCircle size={18} />
                <span>+ Create Ticket</span>
              </button>

              <button
                id="btn-quick-view-my-tickets"
                onClick={() => navigate('/tickets')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: '#F3F4F6',
                  color: '#1A1A1A',
                  border: '1px solid #D1D5DB',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <FileText size={18} color="#006B3C" />
                <span>View My Tickets</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Helper ── */}
      <style>{`
        .spin-animation {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .dashboard-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08) !important;
          border-color: #006B3C !important;
        }
        .dashboard-metric-card:focus-visible {
          border-color: var(--color-border-focus, #006B3C) !important;
          box-shadow: 0 0 0 3px rgba(0, 107, 60, 0.25) !important;
        }
        .recent-ticket-row:hover {
          background-color: #F9FAFB !important;
        }
        @media (max-width: 900px) {
          .dashboard-content-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default RequesterDashboard;
