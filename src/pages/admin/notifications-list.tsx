import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Eye, RefreshCw, Pencil, HelpCircle, CheckCircle, CheckCheck } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAllNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import type { Notification } from '@/hooks/use-notifications';

const EVENT_ICONS: Record<string, typeof Eye> = {
  offer_viewed: Eye,
  proposal_submitted: RefreshCw,
  correction_submitted: Pencil,
  question_submitted: HelpCircle,
  offer_accepted: CheckCircle,
};

const EVENT_LABELS: Record<string, string> = {
  offer_viewed: 'Wyświetlone',
  proposal_submitted: 'Propozycje',
  correction_submitted: 'Korekty',
  question_submitted: 'Pytania',
  offer_accepted: 'Akceptacje',
};

const getIcon = (eventType: string) => EVENT_ICONS[eventType] ?? Bell;

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(date, { addSuffix: true, locale: pl });
  }
  return format(date, 'dd.MM.yyyy HH:mm');
};

export const NotificationsListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const { data, isLoading } = useAllNotifications(page, filter);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 1;

  const handleClick = (notif: Notification) => {
    if (!notif.is_read) {
      markRead.mutate(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Powiadomienia</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending}
        >
          <CheckCheck className="mr-1.5 h-4 w-4" />
          Oznacz wszystkie jako przeczytane
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">Wszystkie</TabsTrigger>
          <TabsTrigger value="unread">Nieprzeczytane</TabsTrigger>
          {Object.entries(EVENT_LABELS).map(([key, label]) => (
            <TabsTrigger key={key} value={key}>{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : !data?.items.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p>Brak powiadomień</p>
            </div>
          ) : (
            <div className="divide-y">
              {data.items.map((notif) => {
                const Icon = getIcon(notif.event_type);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 ${
                      !notif.is_read ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold' : ''}`}>
                          {notif.title}
                        </p>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Poprzednia
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Następna
          </Button>
        </div>
      )}
    </div>
  );
};
