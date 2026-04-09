import { DishForm } from '@/components/features/dishes/dish-form';

export const DishNewPage = () => (
  <div className="space-y-6">
    <h1 className="text-2xl font-bold">Nowe danie</h1>
    <DishForm mode="create" />
  </div>
);
