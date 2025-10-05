import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { OrchestratorResponse, WorkflowStep } from '../types';
import { Bot, Code, MessageSquare, CheckCircle } from 'lucide-react';

interface WorkflowVisualizerProps {
  workflow: OrchestratorResponse | null;
  currentStep: string | null;
}

export function WorkflowVisualizer({ workflow, currentStep }: WorkflowVisualizerProps) {
  const { t } = useTranslation();

  if (!workflow) return null;

  const getIcon = (agent: string) => {
    switch (agent) {
      case 'Orchestrator':
        return <Bot className="w-5 h-5" />;
      case 'CodeGenAgent':
        return <Code className="w-5 h-5" />;
      case 'ExplainAgent':
        return <MessageSquare className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const isStepActive = (step: WorkflowStep) => {
    return currentStep === step.agent || currentStep === step.action;
  };

  const isStepComplete = (index: number) => {
    const currentIndex = workflow.workflow.findIndex(s => isStepActive(s));
    return currentIndex > index || currentStep === 'complete';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
    >
      <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">
        Workflow: {workflow.intent}
      </h3>

      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <AnimatePresence>
          {workflow.workflow.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4 mb-6 last:mb-0"
            >
              {/* Step Icon */}
              <motion.div
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                  isStepActive(step)
                    ? 'bg-blue-500 text-white scale-110'
                    : isStepComplete(index)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
                animate={isStepActive(step) ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: isStepActive(step) ? Infinity : 0, duration: 2 }}
              >
                {getIcon(step.agent)}
              </motion.div>

              {/* Step Content */}
              <div className="flex-1 pt-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {step.agent}
                  </h4>
                  {isStepActive(step) && (
                    <motion.div
                      className="flex gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75" />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {step.description}
                </p>
              </div>

              {/* Checkmark */}
              {isStepComplete(index) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-green-500"
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {workflow.reasoning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Reasoning: </span>
            {workflow.reasoning}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
