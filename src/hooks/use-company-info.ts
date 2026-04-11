import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY } from '@/lib/company-config';
import type { Tables } from '@/integrations/supabase/types';

export type CompanyInfo = Tables<'company_info'>;

export const useCompanyInfo = () =>
  useQuery({
    queryKey: ['company-info'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    select: (data) => ({
      name: data?.company_name ?? COMPANY.name,
      phone: data?.phone ?? COMPANY.phone,
      email: data?.email ?? COMPANY.email,
      address: [data?.address_line1, data?.address_line2].filter(Boolean).join(', ') || COMPANY.address,
      nip: data?.nip ?? COMPANY.nip,
      website: data?.website ?? COMPANY.website,
      instagram: data?.instagram ?? COMPANY.instagram,
      facebook: data?.facebook ?? '',
      logoUrl: data?.logo_url ?? null,
      legalName: data?.legal_form ?? COMPANY.legalName,
      regon: data?.regon ?? COMPANY.regon,
    }),
  });
