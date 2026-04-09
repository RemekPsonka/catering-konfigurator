import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'push-notification-dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const PushPermissionBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;

    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed && Date.now() - Number(dismissed) < DISMISS_DURATION_MS) return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleEnable = async () => {
    const result = await Notification.requestPermission();
    setVisible(false);
    if (result === 'denied') {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="flex items-center justify-center gap-3 bg-primary/10 px-4 py-2 text-sm">
      <Bell className="h-4 w-4 text-primary" />
      <span>Włącz powiadomienia aby nie przegapić aktywności klientów</span>
      <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleEnable}>
        Włącz
      </Button>
      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleDismiss}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
