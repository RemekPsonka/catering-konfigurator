import { useParams } from 'react-router-dom';
import { Construction } from 'lucide-react';

export const PublicOfferPage = () => {
  const { publicToken } = useParams<{ publicToken: string }>();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Construction className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-semibold text-foreground">Oferta — w budowie</h1>
      <p className="text-sm text-muted-foreground">
        Token oferty: <code className="rounded bg-muted px-2 py-0.5">{publicToken}</code>
      </p>
    </div>
  );
};
