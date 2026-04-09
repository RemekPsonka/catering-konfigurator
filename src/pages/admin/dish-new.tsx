import { useNavigate } from 'react-router-dom';
import { DishForm } from '@/components/features/dishes/dish-form';

export const DishNewPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Nowe danie</h1>
      <DishForm
        mode="create"
        onCreated={(dishId) => navigate(`/admin/dishes/${dishId}/edit`)}
      />
    </div>
  );
};
