import { Check } from "lucide-react";
import { motion } from "motion/react";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isPending = step.number > currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center flex-1">
              {/* Circle */}
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors relative z-10 ${
                  isCompleted
                    ? "bg-blue-600 text-white"
                    : isCurrent
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-500"
                }`}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.number}
              </motion.div>

              {/* Label */}
              <div className="text-center mt-3 max-w-[120px]">
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? "text-blue-600" : isCompleted ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
