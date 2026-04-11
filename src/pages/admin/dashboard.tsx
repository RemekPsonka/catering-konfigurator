import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  FileText,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  MessageSquare,
  HelpCircle,
  Plus,
  BarChart3,
  Users,
  Trophy,
  Mail,
  XCircle,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  useDashboardKpi,
  useNewCorrectionsCount,
  useExpiringOffers,
  useDashboardActivity,
  useManagerName,
  useFollowUps,
  useCancelFollowUp,
} from '@/hooks/use-dashboard';
import { useHotOffers } from '@/hooks/use-hot-offers';

const EVENT_ICONS: Record<string, typeof Eye> = {
  offer_viewed: Eye,
  proposal_submitted: RefreshCw,
  correction_submitted: MessageSquare,
  question_submitted: HelpCircle,
  offer_accepted: CheckCircle2,
};

const STEP_NAME_LABELS: Record<string, string> = {
  thank_you: 'Podziękowanie',
  reminder_48h: 'Przypomnienie 48h',
  manager_alert: 'Alert managera',
  expiry_warning: 'Wygasa za 3 dni',
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data: kpi, isLoading: kpiLoading } = useDashboardKpi();
  const { data: correctionsCount = 0 } = useNewCorrectionsCount();
  const { data: expiring = [] } = useExpiringOffers();
  const { data: activity = [], isLoading: activityLoading } = useDashboardActivity();
  const { data: managerName = '' } = useManagerName();
  const { data: followUps = [], isLoading: followUpsLoading } = useFollowUps();
  const cancelFollowUp = useCancelFollowUp();

  const today = format(new Date(), "d MMMM yyyy", { locale: pl });
  const toHandleCount = (kpi?.revision ?? 0) + correctionsCount;
  const hasWarnings = expiring.length > 0 || correctionsCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Dzień dobry{managerName ? `, ${managerName}` : ''}!
        </h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Szkice"
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          value={kpi?.draft}
          loading={kpiLoading}
          className="border-l-4 border-l-muted-foreground/40"
          onClick={() => navigate('/admin/offers?status=draft')}
        />
        <KpiCard
          label="Wysłane"
          icon={<Send className="h-5 w-5 text-blue-500" />}
          value={kpi ? kpi.sent + kpi.viewed : undefined}
          subtitle={kpi?.viewed ? `w tym ${kpi.viewed} otworzonych` : undefined}
          loading={kpiLoading}
          className="border-l-4 border-l-blue-500"
          onClick={() => navigate('/admin/offers?status=sent')}
        />
        <KpiCard
          label="Do obsłużenia"
          icon={<RefreshCw className="h-5 w-5 text-orange-500" />}
          value={kpiLoading ? undefined : toHandleCount}
          loading={kpiLoading}
          className="border-l-4 border-l-orange-500"
          onClick={() => navigate('/admin/offers?status=revision')}
          pulse={toHandleCount > 0}
        />
        <KpiCard
          label="Zaakceptowane"
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          value={kpi?.accepted}
          loading={kpiLoading}
          className="border-l-4 border-l-green-600"
          onClick={() => navigate('/admin/offers?status=accepted')}
        />
        <KpiCard
          label="Wygrane"
          icon={<Trophy className="h-5 w-5 text-emerald-600" />}
          value={kpi?.won}
          loading={kpiLoading}
          className="border-l-4 border-l-emerald-600"
          onClick={() => navigate('/admin/offers?status=won')}
        />
      </div>

      {/* Warnings */}
      {hasWarnings && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Wymaga uwagi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiring.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">
                  {expiring.length} {expiring.length === 1 ? 'oferta wygasa' : 'ofert wygasa'} w ciągu 7 dni
                </p>
                <ul className="space-y-1">
                  {expiring.map((o) => (
                    <li key={o.id} className="flex items-center justify-between text-sm">
                      <button
                        className="text-primary hover:underline text-left"
                        onClick={() => navigate(`/admin/offers/${o.id}/edit`)}
                      >
                        {o.offer_number} — {o.clients?.name ?? 'Brak klienta'} (do{' '}
                        {o.valid_until ? format(new Date(o.valid_until), 'dd.MM.yyyy') : '—'})
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {correctionsCount > 0 && (
              <div>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => navigate('/admin/notifications')}
                >
                  {correctionsCount} {correctionsCount === 1 ? 'nowe pytanie/korekta' : 'nowych pytań/korekt'} od
                  klientów →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Follow-ups */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Zaplanowane follow-upy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followUpsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak zaplanowanych follow-upów</p>
          ) : (
            <ul className="space-y-2">
              {followUps.map((fu) => (
                <li key={fu.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fu.offers?.offer_number ?? '—'} · {STEP_NAME_LABELS[fu.step_name] ?? fu.step_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fu.status === 'sent'
                        ? `Wysłano ${fu.sent_at ? formatDistanceToNow(new Date(fu.sent_at), { addSuffix: true, locale: pl }) : ''}`
                        : `Zaplanowano ${formatDistanceToNow(new Date(fu.scheduled_at), { addSuffix: true, locale: pl })}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={fu.status === 'sent' ? 'bg-green-50 text-green-700 border-none' : 'bg-blue-50 text-blue-700 border-none'}>
                    {fu.status === 'sent' ? 'Wysłano' : 'Zaplanowano'}
                  </Badge>
                  {fu.status === 'scheduled' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        cancelFollowUp.mutate(fu.id, {
                          onSuccess: () => toast.success('Follow-up anulowany'),
                          onError: () => toast.error('Nie udało się anulować'),
                        });
                      }}
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ostatnia aktywność</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak aktywności</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((n) => {
                const Icon = EVENT_ICONS[n.event_type] ?? Eye;
                const unread = !n.is_read;
                return (
                  <li key={n.id}>
                    <button
                      className="flex items-start gap-3 w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
                      onClick={() => n.link && navigate(n.link)}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${unread ? 'font-semibold' : ''}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {n.created_at
                            ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: pl })
                            : ''}
                        </p>
                      </div>
                      {unread && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate('/admin/offers/new')}>
          <Plus className="h-4 w-4 mr-1" />
          Nowa oferta
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/offers')}>
          <BarChart3 className="h-4 w-4 mr-1" />
          Wszystkie oferty
        </Button>
        <Button variant="outline" onClick={() => navigate('/admin/clients')}>
          <Users className="h-4 w-4 mr-1" />
          Klienci
        </Button>
      </div>
    </div>
  );
};

/* ── KPI Card ── */

interface KpiCardProps {
  label: string;
  icon: React.ReactNode;
  value: number | undefined;
  subtitle?: string;
  loading: boolean;
  className?: string;
  onClick: () => void;
  pulse?: boolean;
}

const KpiCard = ({ label, icon, value, subtitle, loading, className, onClick, pulse }: KpiCardProps) => (
  <Card
    className={`cursor-pointer hover:shadow-md transition-shadow ${className ?? ''}`}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        {icon}
        {pulse && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className="text-3xl font-bold">{value ?? 0}</p>
      )}
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </CardContent>
  </Card>
);
