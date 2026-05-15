import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Heart, Thermometer, User, Clock, Calendar } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { supabaseService } from '@/src/services/supabaseService';

const vitals = [
  { label: 'Heart Rate', value: '72', unit: 'bpm', icon: Heart, color: 'text-red-500', bg: 'bg-red-50', trend: 'Normal' },
  { label: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50', trend: 'Normal' },
  { label: 'Temperature', value: '98.6', unit: '°F', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50', trend: 'Normal' },
];

const conditions = ['Hypertension', 'Type 2 Diabetes (Managed)'];
const medications = ['Metformin 500 mg', 'Lisinopril 10 mg'];

const vaccinations = [
  {
    name: 'Influenza (Annual)',
    status: 'completed',
    date: new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date('2025-10-01')),
  },
  {
    name: 'Pneumococcal',
    status: 'upcoming',
    date: new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date('2026-04-01')),
  },
];

export default function PatientDashboard() {
  const shouldReduceMotion = useReducedMotion();
  const [patientVitals, setPatientVitals] = useState(vitals);

  useEffect(() => {
    const loadVitals = async () => {
      try {
        const data = await supabaseService.getPatientData('patient-123');
        if (data && data.vital_signs) {
          const updatedVitals = vitals.map(v => {
            const val = data.vital_signs[v.label === 'Heart Rate' ? 'heartRate' : v.label === 'Blood Pressure' ? 'bloodPressure' : 'temperature'];
            return { ...v, value: val.toString() };
          });
          setPatientVitals(updatedVitals);
        }
      } catch (error) {
        console.error('Error fetching patient vitals:', error);
      }
    };
    loadVitals();
  }, []);

  return (
    <>
      {/* Vitals Section - Refined Glass Cards */}
      <section aria-label="Patient vitals" role="region">
        <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 sm:mb-5 px-1">
          Real-time Biomarkers
        </h3>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6"
          role="status"
          aria-label="Real-time vitals overview"
          aria-live="polite"
        >
          {patientVitals.map((vital, i) => (
            <motion.div
              key={vital.label}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 28,
                delay: shouldReduceMotion ? 0 : i * 0.08,
              }}
            >
              <div className="glass-panel card-premium p-5 sm:p-6 flex flex-col gap-4 sm:gap-5 rounded-[24px] sm:rounded-[28px]">
                <div className="flex items-center justify-between">
                  <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl ${vital.bg} ring-4 ring-white/30 shrink-0`} aria-hidden="true">
                    <vital.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${vital.color}`} />
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    {vital.trend}
                  </Badge>
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5 sm:mb-1">{vital.label}</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums flex items-baseline gap-1 sm:gap-1.5" aria-label={`${vital.label}: ${vital.value} ${vital.unit}`}>
                    {vital.value}
                    <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase">{vital.unit}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Conditions & Medications - Staggered Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-4">
        <motion.div
           initial={{ opacity: 0, x: -16, scale: 0.97 }}
           animate={{ opacity: 1, x: 0, scale: 1 }}
           transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.3 }}
           className="h-full"
        >
          <Card className="h-full group bg-white/40 border-white/60 shadow-glass rounded-[24px] sm:rounded-[32px] overflow-hidden backdrop-blur-md">
            <CardHeader className="p-6 sm:p-8 border-b border-white/40 bg-white/20 flex flex-row items-center gap-3 space-y-0">
               <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
               </div>
               <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Chronic Conditions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-2 sm:space-y-3 overflow-y-auto">
              {conditions.map((c) => (
                <div key={c} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/40 border border-white/60 group/item hover:bg-white transition-all duration-300 cursor-default">
                  <span className="text-sm font-bold text-slate-700">{c}</span>
                  <Badge className="bg-emerald-100/50 text-emerald-700 border-none px-2 sm:px-3 font-bold text-[9px] sm:text-[10px]">active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, x: 16, scale: 0.97 }}
           animate={{ opacity: 1, x: 0, scale: 1 }}
           transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.4 }}
           className="h-full"
        >
          <Card className="h-full group bg-white/40 border-white/60 shadow-glass rounded-[24px] sm:rounded-[32px] overflow-hidden backdrop-blur-md">
            <CardHeader className="p-6 sm:p-8 border-b border-white/40 bg-white/20 flex flex-row items-center gap-3 space-y-0">
               <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
               </div>
               <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Medications</CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-2 sm:space-y-3 overflow-y-auto">
              {medications.map((m) => (
                <div key={m} className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/40 border border-white/60 group/item hover:bg-white transition-all duration-300 cursor-default">
                  <span className="text-sm font-bold text-slate-700 tabular-nums">{m}</span>
                  <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[9px] sm:text-[10px] px-2 sm:px-3 uppercase tracking-tighter">Daily</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Vaccination Schedule - Full Width Card */}
      <motion.div
         initial={{ opacity: 0, y: 20, scale: 0.97 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         transition={{ type: 'spring', stiffness: 380, damping: 30, delay: 0.5 }}
         className="pt-4"
      >
        <Card className="bg-white/40 border-white/60 shadow-glass rounded-[32px] sm:rounded-[40px] overflow-hidden backdrop-blur-md">
          <CardHeader className="p-6 sm:p-8 border-b border-white/40 bg-white/20 flex flex-row items-center gap-3 space-y-0">
             <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
             </div>
             <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">Vaccination History</CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-10 overflow-y-auto">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8" role="list" aria-label="Vaccination history">
              {vaccinations.map((v) => (
                <li key={v.name} className="flex items-center gap-4 sm:gap-6 group">
                  <div
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ring-4 sm:ring-8 transition-all duration-500 shrink-0 ${
                      v.status === 'completed' 
                        ? 'bg-emerald-500 ring-emerald-500/10 group-hover:ring-emerald-500/20' 
                        : 'bg-orange-400 ring-orange-500/10 group-hover:ring-orange-500/20'
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-black text-slate-900 group-hover:text-primary transition-colors truncate">{v.name}</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                      {v.status === 'completed' ? `Administered on ${v.date}` : `Scheduled for ${v.date}`}
                    </p>
                  </div>
                  {v.status === 'upcoming' && (
                    <Badge className="bg-orange-100/50 text-orange-600 border-none font-black text-[8px] sm:text-[10px] px-2 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-widest shrink-0">
                      Upcoming
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
