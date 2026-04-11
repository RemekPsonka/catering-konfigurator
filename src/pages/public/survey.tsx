import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { COMPANY } from '@/lib/company-config';
import { fadeInUp } from '@/lib/animations';

type SurveyState = 'loading' | 'ready' | 'submitted' | 'invalid';

interface SurveyData {
  offerId: string;
  clientName: string | null;
  eventType: string | null;
}

export const SurveyPage = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<SurveyState>('loading');
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) { setState('invalid'); return; }

      const { data: followUp } = await supabase
        .from('offer_follow_ups')
        .select('offer_id, offers(client_id, event_type, clients(name))')
        .eq('survey_token', token)
        .eq('step_name', 'post_event_survey')
        .maybeSingle();

      if (!followUp) { setState('invalid'); return; }

      const offer = followUp.offers as unknown as {
        client_id: string | null;
        event_type: string;
        clients: { name: string } | null;
      };

      // Check if already submitted
      const { count } = await supabase
        .from('survey_responses')
        .select('id', { count: 'exact', head: true })
        .eq('offer_id', followUp.offer_id);

      if (count && count > 0) { setState('submitted'); return; }

      setSurveyData({
        offerId: followUp.offer_id,
        clientName: offer?.clients?.name ?? null,
        eventType: offer?.event_type ?? null,
      });
      setState('ready');
    };
    validate();
  }, [token]);

  const handleSubmit = async () => {
    if (!surveyData || rating === 0) return;
    setSubmitting(true);

    try {
      // Insert survey response
      await supabase.from('survey_responses').insert({
        offer_id: surveyData.offerId,
        rating,
        comment: comment.trim() || null,
        client_name: surveyData.clientName,
        event_type: surveyData.eventType,
      });

      // If rating >= 4 and comment exists, auto-create testimonial draft
      if (rating >= 4 && comment.trim()) {
        await supabase.from('testimonials').insert({
          client_name: surveyData.clientName ?? 'Klient',
          quote: comment.trim(),
          rating,
          event_type: surveyData.eventType,
          is_active: false,
          sort_order: 999,
        });
      }

      setState('submitted');
    } catch {
      // silent fail — user sees no change
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="h-8 w-8 rounded-full border-2 border-charcoal/20 border-t-charcoal"
        />
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] p-6">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h1 className="font-display text-xl font-bold text-charcoal">Nieprawidłowy link</h1>
          <p className="mt-2 text-sm text-charcoal/60">
            Ten link ankiety jest nieprawidłowy lub wygasł. Skontaktuj się z nami bezpośrednio.
          </p>
        </motion.div>
      </div>
    );
  }

  if (state === 'submitted') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] p-6">
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="max-w-md text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-charcoal"
          >
            <CheckCircle2 className="h-8 w-8 text-ivory" />
          </motion.div>
          <h1 className="font-display text-xl font-bold text-charcoal">Dziękujemy za opinię!</h1>
          <p className="mt-2 text-sm text-charcoal/60 leading-relaxed">
            Twoja opinia jest dla nas bardzo ważna i pomoże nam się rozwijać.
          </p>

          {COMPANY.googleReviewUrl && (
            <motion.a
              href={COMPANY.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3 font-body text-sm font-semibold text-ivory shadow-lg transition-all"
            >
              <Star className="h-4 w-4" />
              Oceń nas na Google
              <ExternalLink className="h-3.5 w-3.5" />
            </motion.a>
          )}

          <p className="mt-8 text-xs text-charcoal/40">
            Planujecie kolejne wydarzenie? Napisz do nas: {COMPANY.email}
          </p>
        </motion.div>
      </div>
    );
  }

  // state === 'ready'
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] p-6">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="text-center font-display text-xl font-bold text-charcoal">
          Jak było? 🎉
        </h1>
        {surveyData?.clientName && (
          <p className="mt-2 text-center text-sm text-charcoal/60">
            Cześć {surveyData.clientName}, mamy nadzieję że wydarzenie było udane!
          </p>
        )}

        {/* Star rating */}
        <div className="mt-8 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-colors"
            >
              <Star
                className="h-10 w-10"
                fill={(hoveredStar || rating) >= star ? '#c9a84c' : 'transparent'}
                stroke={(hoveredStar || rating) >= star ? '#c9a84c' : '#d1d5db'}
                strokeWidth={1.5}
              />
            </motion.button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-2 text-center text-xs text-charcoal/50">
            {rating <= 2 ? 'Przykro nam, postaramy się poprawić.' : rating <= 3 ? 'Dziękujemy za szczerość!' : 'Cieszymy się! 🎉'}
          </p>
        )}

        {/* Comment */}
        <div className="mt-6">
          <label className="mb-1.5 block text-sm font-medium text-charcoal/70">
            Twój komentarz (opcjonalnie)
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Co Ci się podobało? Co możemy poprawić?"
            className="min-h-[100px] resize-none rounded-xl border-charcoal/10 bg-[#FAF7F2] focus:border-charcoal/30"
            maxLength={1000}
          />
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="mt-6 w-full rounded-xl bg-charcoal py-3 font-body text-sm font-semibold text-ivory shadow-lg transition-all disabled:opacity-50"
        >
          {submitting ? 'Wysyłanie...' : 'Wyślij opinię'}
        </motion.button>

        {/* Google review CTA */}
        {COMPANY.googleReviewUrl && (
          <a
            href={COMPANY.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-charcoal/50 transition-colors hover:text-charcoal/80"
          >
            <Star className="h-3.5 w-3.5" />
            Podziel się opinią na Google
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </motion.div>
    </div>
  );
};
