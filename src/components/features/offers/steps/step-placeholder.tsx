import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface StepPlaceholderProps {
  title: string;
}

export const StepPlaceholder = ({ title }: StepPlaceholderProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Construction className="h-12 w-12 mb-4" />
      <p className="text-lg font-medium">W budowie</p>
      <p className="text-sm">Ta sekcja zostanie wkrótce zaimplementowana.</p>
    </CardContent>
  </Card>
);
