/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import ControlPanel from './components/OutfitStack'; // Repurposed from OutfitStack
import { generateLogoOnBoxImage, generateAngleVariation } from './services/geminiService';
import { BoxItem, GeneratedImageHistory } from './types';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';

const ANGLE_INSTRUCTIONS = [
  "Vista Frontal",
  "Vista en Ángulo",
  "Vista Superior",
  "Primer Plano del Logo",
  "En un Entorno de Lujo",
];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};

const App: React.FC = () => {
  const [selectedBox, setSelectedBox] = useState<BoxItem | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageHistory>({});
  const [currentAngleIndex, setCurrentAngleIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const displayImageUrl = useMemo(() => {
    const currentAngleInstruction = ANGLE_INSTRUCTIONS[currentAngleIndex];
    return generatedImages[currentAngleInstruction] ?? Object.values(generatedImages)[0] ?? selectedBox?.url;
  }, [generatedImages, currentAngleIndex, selectedBox]);

  const availableAngleKeys = useMemo(() => Object.keys(generatedImages), [generatedImages]);

  const handleStart = useCallback(async ({ box, logo }: { box: BoxItem, logo: File }) => {
    setSelectedBox(box);
    setLogoFile(logo);
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Colocando tu logo en la ${box.name}...`);
    
    try {
      const initialAngle = ANGLE_INSTRUCTIONS[0];
      const newImageUrl = await generateLogoOnBoxImage(box, logo);
      setGeneratedImages({ [initialAngle]: newImageUrl });
      setCurrentAngleIndex(0);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'No se pudo generar la maqueta'));
      // Reset on initial failure
      setSelectedBox(null);
      setLogoFile(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleStartOver = () => {
    setSelectedBox(null);
    setLogoFile(null);
    setGeneratedImages({});
    setCurrentAngleIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
  };
  
  const handleAngleSelect = useCallback(async (newIndex: number) => {
    if (isLoading || newIndex === currentAngleIndex || !selectedBox) return;
    
    const angleInstruction = ANGLE_INSTRUCTIONS[newIndex];
    
    if (generatedImages[angleInstruction]) {
      setCurrentAngleIndex(newIndex);
      return;
    }

    const baseImageForAngleChange = Object.values(generatedImages)[0];
    if (!baseImageForAngleChange) return;

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Cambiando la vista a "${angleInstruction}"...`);
    
    const prevAngleIndex = currentAngleIndex;
    setCurrentAngleIndex(newIndex);

    try {
      const newImageUrl = await generateAngleVariation(baseImageForAngleChange, angleInstruction);
      setGeneratedImages(prev => ({ ...prev, [angleInstruction]: newImageUrl }));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'No se pudo cambiar la vista'));
      setCurrentAngleIndex(prevAngleIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentAngleIndex, generatedImages, isLoading, selectedBox]);

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!selectedBox || !logoFile ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onStart={handleStart} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handleAngleSelect} // Prop name is kept for simplicity
                  poseInstructions={ANGLE_INSTRUCTIONS}
                  currentPoseIndex={currentAngleIndex}
                  availablePoseKeys={availableAngleKeys}
                />
              </div>

              <aside className="absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60">
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <ControlPanel 
                      selectedBox={selectedBox}
                      logoFile={logoFile}
                    />
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!selectedBox} />
    </div>
  );
};

export default App;