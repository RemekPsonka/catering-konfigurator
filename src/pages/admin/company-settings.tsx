import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Building2, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyInfoRaw, useUpdateCompanyInfo } from '@/hooks/use-company-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/loading-spinner';

const nipRegex = /^(\d{10}|\d{3}-\d{3}-\d{2}-\d{2})$/;
const phoneRegex = /^\+?[\d\s-]{7,20}$/;

const companySchema = z.object({
  company_name: z.string().trim().min(1, 'Nazwa firmy jest wymagana').max(200),
  legal_form: z.string().trim().max(200).optional().or(z.literal('')),
  address_line1: z.string().trim().max(200).optional().or(z.literal('')),
  address_line2: z.string().trim().max(200).optional().or(z.literal('')),
  nip: z.string().trim().regex(nipRegex, 'Nieprawidłowy NIP (10 cyfr lub XXX-XXX-XX-XX)').optional().or(z.literal('')),
  regon: z.string().trim().max(20).optional().or(z.literal('')),
  bank_name: z.string().trim().max(200).optional().or(z.literal('')),
  bank_account: z.string().trim().max(50).optional().or(z.literal('')),
  phone: z.string().trim().regex(phoneRegex, 'Nieprawidłowy numer telefonu').optional().or(z.literal('')),
  email: z.string().trim().email('Nieprawidłowy adres email').optional().or(z.literal('')),
  website: z.string().trim().max(200).optional().or(z.literal('')),
  instagram: z.string().trim().max(200).optional().or(z.literal('')),
  facebook: z.string().trim().max(200).optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanySettingsPageProps {
  embedded?: boolean;
}

export const CompanySettingsPage = ({ embedded = false }: CompanySettingsPageProps) => {
  const { data: companyData, isLoading } = useCompanyInfoRaw();
  const updateCompany = useUpdateCompanyInfo();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company_name: '',
      legal_form: '',
      address_line1: '',
      address_line2: '',
      nip: '',
      regon: '',
      bank_name: '',
      bank_account: '',
      phone: '',
      email: '',
      website: '',
      instagram: '',
      facebook: '',
    },
  });

  useEffect(() => {
    if (companyData) {
      form.reset({
        company_name: companyData.company_name ?? '',
        legal_form: companyData.legal_form ?? '',
        address_line1: companyData.address_line1 ?? '',
        address_line2: companyData.address_line2 ?? '',
        nip: companyData.nip ?? '',
        regon: companyData.regon ?? '',
        bank_name: companyData.bank_name ?? '',
        bank_account: companyData.bank_account ?? '',
        phone: companyData.phone ?? '',
        email: companyData.email ?? '',
        website: companyData.website ?? '',
        instagram: companyData.instagram ?? '',
        facebook: companyData.facebook ?? '',
      });
      setLogoPreview(companyData.logo_url ?? null);
    }
  }, [companyData, form]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo nie może przekraczać 2 MB');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoPreview;
    const ext = logoFile.name.split('.').pop() ?? 'png';
    const path = `logo-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('company-assets').upload(path, logoFile, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const onSubmit = async (values: CompanyFormValues) => {
    if (!companyData?.id) {
      toast.error('Nie znaleziono danych firmy');
      return;
    }
    try {
      setUploading(true);
      const logoUrl = await uploadLogo();
      updateCompany.mutate(
        {
          id: companyData.id,
          updates: {
            ...values,
            logo_url: logoUrl,
          },
        },
        {
          onSuccess: () => toast.success('Dane firmy zapisane'),
          onError: () => toast.error('Nie udało się zapisać danych firmy'),
        },
      );
    } catch {
      toast.error('Nie udało się przesłać logo');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Dane firmy</h1>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
          {/* Dane prawne */}
          <Card>
            <CardHeader><CardTitle>Dane prawne</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="company_name" render={({ field }) => (
                <FormItem><FormLabel>Nazwa firmy *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="legal_form" render={({ field }) => (
                <FormItem><FormLabel>Forma prawna</FormLabel><FormControl><Input placeholder="np. Sp. z o.o." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address_line1" render={({ field }) => (
                <FormItem><FormLabel>Adres (linia 1)</FormLabel><FormControl><Input placeholder="ul. Brynicy 24" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address_line2" render={({ field }) => (
                <FormItem><FormLabel>Adres (linia 2)</FormLabel><FormControl><Input placeholder="40-358 Katowice" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="nip" render={({ field }) => (
                <FormItem><FormLabel>NIP</FormLabel><FormControl><Input placeholder="9542879370" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="regon" render={({ field }) => (
                <FormItem><FormLabel>REGON</FormLabel><FormControl><Input placeholder="540182342" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Kontakt */}
          <Card>
            <CardHeader><CardTitle>Kontakt</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Telefon</FormLabel><FormControl><Input placeholder="+48 793 001 900" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="zamowienia@cateringslaski.pl" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem><FormLabel>Strona www</FormLabel><FormControl><Input placeholder="https://cateringslaski.pl" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Media społecznościowe */}
          <Card>
            <CardHeader><CardTitle>Media społecznościowe</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="instagram" render={({ field }) => (
                <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input placeholder="@cateringslaski" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="facebook" render={({ field }) => (
                <FormItem><FormLabel>Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Dane bankowe */}
          <Card>
            <CardHeader><CardTitle>Dane bankowe</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="bank_name" render={({ field }) => (
                <FormItem><FormLabel>Nazwa banku</FormLabel><FormControl><Input placeholder="mBank" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="bank_account" render={({ field }) => (
                <FormItem><FormLabel>Numer konta</FormLabel><FormControl><Input placeholder="PL XX XXXX XXXX XXXX XXXX XXXX XXXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Logo */}
          <Card>
            <CardHeader><CardTitle>Logo firmy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {logoPreview && (
                <div className="relative inline-block">
                  <img src={logoPreview} alt="Logo firmy" className="h-24 w-auto rounded-md border border-border object-contain" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={removeLogo}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <div>
                <label htmlFor="logo-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  {logoPreview ? 'Zmień logo' : 'Wgraj logo'}
                </label>
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG lub SVG. Maks. 2 MB.</p>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={uploading || updateCompany.isPending} className="w-full sm:w-auto">
            {uploading || updateCompany.isPending ? 'Zapisywanie...' : 'Zapisz dane firmy'}
          </Button>
        </form>
      </Form>
    </div>
  );
};
