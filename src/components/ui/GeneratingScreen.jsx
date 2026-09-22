import { useState, useEffect } from 'react';
import { Loader2, Check, Lightbulb } from 'lucide-react';

const GENERATION_STEPS = {
  ar: [
    'نفهم عملك ومنتجك...',
    'نحلل هدفك والمنصة...',
    'نبني المحتوى...',
    'نطبق هوية علامتك التجارية...',
    'نجهز النتيجة النهائية...',
  ],
  en: [
    'Understanding your business...',
    'Analyzing your goal and platform...',
    'Building the content...',
    'Applying your brand identity...',
    'Preparing the final result...',
  ],
};

function GeneratingScreen({ language, icon: Icon = Lightbulb, color = 'var(--color-accent)' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = GENERATION_STEPS[language] || GENERATION_STEPS.ar;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) return prev + 1;
        return prev;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="generating-screen page-enter">
      <div className="generating-screen__card fx-card fx-card--elevated">
        <div className="generating-screen__icon" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
          <Icon size={40} style={{ color }} />
        </div>
        <div className="generating-screen__spinner">
          <Loader2 size={24} className="spin-animation" />
        </div>
        <h2 className="generating-screen__title">
          {GENERATION_STEPS[language]?.[0] ? steps[currentStep] : 'Generating...'}
        </h2>
        <div className="generating-screen__steps">
          {steps.map((step, i) => (
            <div key={i} className={`generating-step ${i <= currentStep ? 'generating-step--done' : ''} ${i === currentStep ? 'generating-step--active' : ''}`}>
              <div className="generating-step__dot">
                {i < currentStep ? <Check size={10} /> : i === currentStep ? <Loader2 size={10} className="spin-animation" /> : null}
              </div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GeneratingScreen;
