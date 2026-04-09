import { Outlet, useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/use-auth';
import { DEV_MODE } from '@/lib/constants';
import { LogOut, FileText, UtensilsCrossed, Users, Target, Settings, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { title: 'Oferty', url: '/admin/offers', icon: FileText },
  { title: 'Baza potraw', url: '/admin/dishes', icon: UtensilsCrossed },
  { title: 'Usługi', url: '/admin/services', icon: Wrench },
  { title: 'Klienci', url: '/admin/clients', icon: Users },
  { title: 'Leady', url: '/admin/leads', icon: Target },
  { title: 'Ustawienia', url: '/admin/settings', icon: Settings },
];

const SidebarNav = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            CS
          </div>
          {!collapsed && <span className="font-semibold text-foreground">Catering Śląski</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.url)}>
                    <NavLink to={item.url} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export const AdminLayout = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Wylogowano pomyślnie');
    } catch {
      toast.error('Nie udało się wylogować. Spróbuj ponownie.');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarNav />
        <div className="flex-1 flex flex-col">
          {DEV_MODE && (
            <div className="bg-destructive text-destructive-foreground text-center text-sm font-medium py-1.5">
              ⚠️ TRYB DEWELOPERSKI — logowanie wyłączone
            </div>
          )}
          <header className="h-14 flex items-center justify-between border-b px-4">
            <SidebarTrigger className="ml-0" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Wyloguj</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
