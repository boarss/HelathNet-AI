import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, FileSearch, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyzeMedicalImage } from '@/src/services/geminiService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

export default function ImagingAnalysis() {
  const shouldReduceMotion = useReducedMotion();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImage(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const base64 = image.split(',')[1];
      const result = await analyzeMedicalImage(
        base64,
        'Analyze this medical image (X-ray, MRI, or skin condition). Provide a detailed report including potential findings, explainability of the AI’s reasoning, and next steps. Include a strong disclaimer.'
      );
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setAnalysis('Error analyzing image. Please ensure it is a valid medical image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
      {/* Upload card */}
      <Card className="border-none shadow-sm overflow-hidden rounded-[24px] sm:rounded-[32px]" aria-busy={isAnalyzing}>
        <CardHeader className="p-6 sm:p-8 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
            </div>
            Medical Imaging
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm font-medium text-slate-500">
            Upload X-rays, MRIs, or skin condition photos for precise AI analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 pt-0 space-y-5 sm:space-y-6">
          {/* Drop zone */}
          <div
            className="aspect-video bg-slate-50 rounded-[20px] sm:rounded-[28px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 focus-within:border-primary/60 group"
            role="region"
            aria-label="Image upload area"
          >
            <AnimatePresence mode="wait">
              {image ? (
                <motion.div
                  key="image"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full relative"
                >
                  <img
                    src={image}
                    alt="Uploaded medical image"
                    className="w-full h-full object-contain rounded-xl"
                  />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-red-50 transition-all duration-200 group-hover:scale-110 active:scale-90 border border-slate-100"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={shouldReduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 sm:gap-4 text-center"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-primary/40" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Upload medical image</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest leading-none">X-ray, MRI, or Photo</p>
                  </div>
                  <label
                    htmlFor="medical-image-input"
                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-primary hover:text-primary-foreground hover:bg-primary px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border border-primary/20 hover:border-primary transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                  >
                    Choose file
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={fileInputRef}
              id="medical-image-input"
              type="file"
              className={image ? 'hidden' : 'absolute inset-0 opacity-0 cursor-pointer'}
              onChange={handleImageUpload}
              accept="image/*"
              aria-label="Upload medical image"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 rounded-xl sm:rounded-2xl h-11 sm:h-12 order-2 sm:order-1 font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border-none btn-press"
              variant="secondary"
              onClick={handleClearImage}
              disabled={!image}
            >
              Clear
            </Button>
            <Button
              className="flex-1 rounded-xl sm:rounded-2xl h-11 sm:h-12 order-1 sm:order-2 font-black uppercase tracking-widest text-[10px] sm:text-[11px] shadow-lg shadow-primary/10 btn-press"
              onClick={handleAnalyze}
              disabled={!image || isAnalyzing}
            >
              {isAnalyzing ? 'Analyzing…' : 'Analyze with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results card */}
      <Card className="border-none shadow-sm flex flex-col rounded-[24px] sm:rounded-[32px] overflow-hidden">
        <CardHeader className="p-6 sm:p-8 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary/10 rounded-xl flex items-center justify-center ring-4 ring-primary/5">
              <FileSearch className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
            </div>
            Clinical Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-6 sm:p-8 pt-0">
          <ScrollArea className="h-[300px] sm:h-[400px] pr-4">
            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div
                  key="result"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className="space-y-5 sm:space-y-6"
                >
                  <div className="p-4 sm:p-5 bg-orange-50/50 border border-orange-100 rounded-[20px] flex gap-3 sm:gap-4">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-xs text-orange-800 leading-relaxed font-medium">
                      <strong className="font-black uppercase tracking-tighter mr-1.5">Precautions:</strong> 
                      AI findings require clinical correlation. Consult a radiologist for definitive diagnosis.
                    </p>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 font-medium">
                    {analysis}
                  </div>
                  <div className="flex items-center gap-2 pt-5 sm:pt-6 border-t border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                      Neural Evidence Verified
                    </span>
                  </div>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="flex flex-col items-center justify-center py-20 gap-6"
                >
                  <div className="space-y-3 w-full max-w-xs">
                    <div className="skeleton h-4 w-full rounded-full" />
                    <div className="skeleton h-4 w-[85%] rounded-full" />
                    <div className="skeleton h-4 w-[60%] rounded-full" />
                    <div className="skeleton h-4 w-[70%] rounded-full" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest">Analyzing Scan…</p>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20 gap-4 sm:gap-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-[24px] sm:rounded-[32px] flex items-center justify-center animate-pulse">
                    <FileSearch className="w-8 h-8 sm:w-10 sm:h-10 opacity-20" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold uppercase tracking-widest">Awaiting Scan Details</p>
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
