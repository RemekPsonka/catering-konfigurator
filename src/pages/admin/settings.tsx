import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountsPage } from '@/components/features/settings/accounts-page';
import { TemplatesPage } from '@/components/features/settings/templates-page';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

export const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Ustawienia</h1>
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Konta</TabsTrigger>
          <TabsTrigger value="templates">Szablony</TabsTrigger>
          <TabsTrigger value="event-profiles" onClick={() => navigate('/admin/settings/event-profiles')}>
            Profile eventów
          </TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <AccountsPage />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};
