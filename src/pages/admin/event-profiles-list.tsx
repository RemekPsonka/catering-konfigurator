import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { EmptyState } from '@/components/common/empty-state';
import { useEventProfiles, useToggleEventProfile } from '@/hooks/use-event-profiles';
import { EVENT_TYPE_OPTIONS } from '@/lib/offer-constants';
import { ImageIcon, Sparkles, AlertTriangle } from 'lucide-react';

export const EventProfilesListPage = () => {
  const { data: profiles, isLoading } = useEventProfiles();
  const toggleMutation = useToggleEventProfile();
  const navigate = useNavigate();

  if (isLoading) return <LoadingSpinner />;
  if (!profiles?.length) return <EmptyState title="Brak profili" description="Brak profili typów eventów w bazie." />;

  const getLabel = (id: string) => EVENT_TYPE_OPTIONS.find((o) => o.value === id);

  const sorted = [...profiles].sort((a, b) => a.headline.localeCompare(b.headline, 'pl'));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profile typów eventów</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((p) => {
          const opt = getLabel(p.id);
          const featureCount = Array.isArray(p.features) ? (p.features as unknown[]).length : 0;
          const hasHero = !!p.hero_image_url;

          return (
            <Card
              key={p.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/admin/settings/event-profiles/${p.id}`)}
            >
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-32 h-28 flex-shrink-0 rounded-l-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    {p.hero_image_url ? (
                      <img
                        src={p.hero_image_url}
                        alt={p.headline}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {opt?.emoji ?? '📋'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-3 pr-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">{opt?.emoji} {opt?.label ?? p.id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate">{p.headline}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description_short}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          {p.photo_count}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {featureCount}
                        </Badge>
                        {!hasHero && (
                          <Badge variant="destructive" className="text-xs flex-shrink-0">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Brak hero
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      <Switch
                        checked={p.is_active ?? true}
                        onCheckedChange={(checked) => {
                          toggleMutation.mutate({ id: p.id, isActive: checked });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
