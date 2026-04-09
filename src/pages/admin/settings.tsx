import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountsPage } from '@/components/features/settings/accounts-page';
import { TemplatesPage } from '@/components/features/settings/templates-page';

export const SettingsPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Ustawienia</h1>
    <Tabs defaultValue="accounts">
      <TabsList>
        <TabsTrigger value="accounts">Konta</TabsTrigger>
        <TabsTrigger value="templates">Szablony</TabsTrigger>
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
