import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Eye, RefreshCw, Pencil, HelpCircle, CheckCircle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUnreadCount, useNotifications, useMarkRead, useMarkAllRead } from '@/hooks/use-notifications';
import type { Notification } from '@/hooks/use-notifications';

const EVENT_ICONS: Record<string, typeof Eye> = {
  offer_viewed: Eye,
  proposal_submitted: RefreshCw,
  correction_submitted: Pencil,
  question_submitted: HelpCircle,
  offer_accepted: CheckCircle,
};

const getIcon = (eventType: string) => EVENT_ICONS[eventType] ?? Bell;

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifications = [] } = useNotifications(10);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const handleClick = (notif: Notification) => {
    if (!notif.is_read) {
      markRead.mutate(notif.id);
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-sm">Powiadomienia</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Oznacz wszystkie
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Brak powiadomień
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const Icon = getIcon(notif.event_type);
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                      !notif.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold' : ''}`}>
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {notif.created_at
                          ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: pl })
                          : ''}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              setOpen(false);
              navigate('/admin/notifications');
            }}
          >
            Zobacz wszystkie →
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
