import { useParams } from 'react-router-dom';
import { useDish } from '@/hooks/use-dishes';
import { DishForm } from '@/components/features/dishes/dish-form';
import { LoadingSpinner } from '@/components/common/loading-spinner';

export const DishEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: dish, isLoading, error } = useDish(id);

  if (isLoading) return <LoadingSpinner />;
  if (error || !dish) return <p className="text-destructive">Nie udało się załadować dania.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edycja dania: {dish.display_name}</h1>
      <DishForm dish={dish} mode="edit" />
    </div>
  );
};
