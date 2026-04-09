import { Outlet } from 'react-router-dom';
import { SmoothScroll } from '@/components/common/smooth-scroll';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <SmoothScroll>
        <Outlet />
      </SmoothScroll>
    </div>
  );
};
