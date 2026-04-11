import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountsPage } from '@/components/features/settings/accounts-page';
import { TemplatesPage } from '@/components/features/settings/templates-page';
import { TermsPage } from '@/components/features/settings/terms-page';
import { CompanySettingsPage } from '@/pages/admin/company-settings';
import { EventProfilesListPage } from '@/pages/admin/event-profiles-list';
import { Building2, FileText } from 'lucide-react';

export const SettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'accounts';

  const handleTabChange = (value: string) => {
    setSearchParams(value === 'accounts' ? {} : { tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Ustawienia</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="accounts">Konta</TabsTrigger>
          <TabsTrigger value="templates">Szablony</TabsTrigger>
          <TabsTrigger value="terms"><FileText className="mr-1 h-4 w-4" /> Warunki</TabsTrigger>
          <TabsTrigger value="company">
            <Building2 className="mr-1 h-4 w-4" /> Dane firmy
          </TabsTrigger>
          <TabsTrigger value="event-profiles">
            Profile eventów
          </TabsTrigger>
        </TabsList>
        <TabsContent value="accounts">
          <AccountsPage />
        </TabsContent>
        <TabsContent value="templates">
          <TemplatesPage />
        </TabsContent>
        <TabsContent value="terms">
          <TermsPage />
        </TabsContent>
        <TabsContent value="company">
          <CompanySettingsPage embedded />
        </TabsContent>
        <TabsContent value="event-profiles">
          <EventProfilesListPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};
