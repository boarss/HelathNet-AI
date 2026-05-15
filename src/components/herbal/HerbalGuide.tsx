import { useState } from 'react';
import { Leaf, Search, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useWebHaptics } from 'web-haptics/react';

interface Remedy {
  id: string;
  name: string;
  scientificName: string;
  benefits: string[];
  usage: string;
  warnings: string;
  category: 'Respiratory' | 'Digestive' | 'Immunity' | 'Stress' | 'Skin';
  suitability: string[];
}

const REMEDIES: Remedy[] = [
  {
    id: '1',
    name: 'Ginger',
    scientificName: 'Zingiber officinale',
    benefits: ['Nausea relief', 'Anti-inflammatory', 'Digestive aid'],
    usage: 'Fresh tea or supplement. Limit to 4 g daily.',
    warnings: 'May interact with blood thinners. Consult a doctor if pregnant.',
    category: 'Digestive',
    suitability: ['Adults', 'Older Adults', 'Women'],
  },
  {
    id: '2',
    name: 'Chamomile',
    scientificName: 'Matricaria chamomilla',
    benefits: ['Sleep aid', 'Anxiety reduction', 'Skin soothing'],
    usage: 'Brewed as tea 30–60 minutes before bed.',
    warnings: 'Avoid if allergic to ragweed or daisies.',
    category: 'Stress',
    suitability: ['Children', 'Adults', 'Older Adults', 'Women'],
  },
  {
    id: '3',
    name: 'Echinacea',
    scientificName: 'Echinacea purpurea',
    benefits: ['Immune system support', 'Common cold duration reduction'],
    usage: 'Tincture or tea at first sign of symptoms.',
    warnings: 'Not recommended for those with autoimmune disorders.',
    category: 'Immunity',
    suitability: ['Adults', 'Older Adults'],
  },
  {
    id: '4',
    name: 'Peppermint',
    scientificName: 'Mentha piperita',
    benefits: ['IBS relief', 'Headache reduction', 'Mental focus'],
    usage: 'Oil capsules for IBS; tea for general digestion.',
    warnings: 'May worsen heartburn/GERD.',
    category: 'Digestive',
    suitability: ['Children', 'Adults', 'Older Adults', 'Women'],
  },
  {
    id: '5',
    name: 'Turmeric',
    scientificName: 'Curcuma longa',
    benefits: ['Joint health', 'Anti-inflammatory', 'Heart health'],
    usage: 'Combined with black pepper for absorption in cooking or supplements.',
    warnings: 'High doses may cause stomach upset.',
    category: 'Immunity',
    suitability: ['Adults', 'Older Adults'],
  },
];

const CATEGORY_COLORS: Record<Remedy['category'], string> = {
  Respiratory: 'bg-sky-50 text-sky-700',
  Digestive: 'bg-amber-50 text-amber-700',
  Immunity: 'bg-green-50 text-green-700',
  Stress: 'bg-purple-50 text-purple-700',
  Skin: 'bg-pink-50 text-pink-700',
};

export default function HerbalGuide() {
  const shouldReduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { trigger } = useWebHaptics();

  const filteredRemedies = REMEDIES.filter(
    (r) =>
      (searchTerm === '' ||
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.benefits.some((b) => b.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (selectedCategory === null || r.category === selectedCategory)
  );

  const categories = Array.from(new Set(REMEDIES.map((r) => r.category)));

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Search + Filters - Premium Segmented Controls */}
      <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
        <div className="relative w-full xl:w-[420px] group">
          <label htmlFor="herbal-search" className="sr-only">Search herbal remedies</label>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-primary transition-all duration-300 pointer-events-none group-focus-within:scale-110" aria-hidden="true" />
          <Input
            id="herbal-search"
            name="herbal-search"
            placeholder="Search remedies or symptoms..."
            className="pl-12 bg-white/60 backdrop-blur-md border border-white/50 shadow-glass h-12 sm:h-14 rounded-2xl sm:rounded-[24px] focus-visible:ring-4 focus-visible:ring-primary/10 transition-all text-sm font-bold placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search remedies or symptoms"
            autoComplete="off"
          />
        </div>
        
        <div 
          className="bg-slate-200/40 p-1.5 h-auto rounded-[20px] gap-1 backdrop-blur-md overflow-x-auto no-scrollbar max-w-full flex items-center border border-white/50 shadow-inner relative"
          role="group"
          aria-label="Filter by category"
        >
          {[null, ...categories].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat || 'all'}
                onClick={() => {
                  trigger('nudge');
                  setSelectedCategory(cat);
                }}
                className={`relative px-5 py-2.5 rounded-[14px] text-xs sm:text-[13px] font-black uppercase tracking-widest transition-all duration-300 z-10 active:scale-95 whitespace-nowrap ${
                  isSelected ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-pressed={isSelected}
              >
                <span className="relative z-20 flex items-center gap-2">
                  {!cat && <Sparkles className={`w-3 h-3 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />}
                  {cat || 'All Remedies'}
                </span>
                
                {isSelected && (
                  <motion.div
                    layoutId="category-pill"
                    className="absolute inset-0 bg-white shadow-sm border border-slate-200/50 rounded-[14px] z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results grid */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Filtered results"
      >
        {filteredRemedies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-slate-300 gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-inner">
              <Leaf className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" />
            </div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest">No matching remedies</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence mode="popLayout">
              {filteredRemedies.map((remedy, i) => (
                <motion.div
                  key={remedy.id}
                  layout
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 28,
                    delay: shouldReduceMotion ? 0 : i * 0.05,
                  }}
                >
                  <Card className="border-none shadow-glass card-premium h-full flex flex-col rounded-[24px] sm:rounded-[32px] overflow-hidden group bg-white/70 backdrop-blur-xl">
                    <CardHeader className="p-6 sm:p-8 pb-3 sm:pb-4">
                      <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-green-50 rounded-2xl ring-8 ring-green-500/5 transition-all duration-300 group-hover:ring-green-500/10 group-active:scale-90" aria-hidden="true">
                          <Leaf className="w-5 h-5 text-green-600" />
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-lg shadow-sm border border-white/50 ${CATEGORY_COLORS[remedy.category] || ''}`}
                        >
                          {remedy.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">{remedy.name}</CardTitle>
                      <CardDescription className="italic text-sm font-semibold text-slate-400 mt-2 block tracking-tight">
                        {remedy.scientificName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 pt-0 flex-1 flex flex-col space-y-6 sm:space-y-8">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Primary Benefits</p>
                        <div className="flex flex-wrap gap-2">
                          {remedy.benefits.map((b) => (
                            <Badge
                              key={b}
                              variant="outline"
                              className="text-[10px] font-extrabold bg-green-50/30 border-green-100/50 text-emerald-700 px-3 py-1 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                            >
                              {b}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preparation & Dosage</p>
                        <p className="text-sm sm:text-[15px] font-medium text-slate-600 leading-relaxed tracking-tight">{remedy.usage}</p>
                      </div>

                      <div className="p-5 bg-red-50/40 rounded-2xl border border-red-100/50 relative overflow-hidden group/safety" role="note">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-400/50" />
                        <div className="flex gap-3 items-start relative z-10">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 group-hover/safety:animate-pulse" />
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-red-600/70">Safety Protocol</p>
                            <p className="text-[11px] sm:text-[12px] text-slate-700 leading-relaxed font-semibold tracking-tight">
                              {remedy.warnings}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-slate-100/80">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Suitability Registry</p>
                        <div className="flex flex-wrap gap-2">
                          {remedy.suitability.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center text-[10px] bg-slate-100/50 text-slate-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-tighter border border-slate-200/30 hover:bg-white transition-colors duration-200"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* CTA Banner - Optimized for mobile flow */}
      <Card className="border-none shadow-glass bg-primary/5 rounded-[28px] sm:rounded-[40px] overflow-hidden">
        <CardContent className="p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-10 items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[24px] sm:rounded-[32px] shadow-sm flex items-center justify-center shrink-0">
              <Leaf className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>
            <div className="flex-1 text-center lg:text-left space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Need Targeted Advice?</h3>
              <p className="text-sm sm:text-base font-medium text-slate-600 leading-relaxed">
                Our AI can analyze your unique health profile to suggest bio-compatible botanicals that avoid drug-herb interactions.
              </p>
            </div>
            <Button className="w-full lg:w-auto rounded-xl sm:rounded-2xl h-12 sm:h-14 px-8 sm:px-10 font-black uppercase tracking-widest text-[10px] sm:text-[12px] shadow-xl shadow-primary/10 btn-press">
              Consult Clinical Intelligence
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
