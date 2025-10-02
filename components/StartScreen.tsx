/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UploadCloudIcon } from './icons';
import { defaultBox } from '../wardrobe';
import { BoxItem } from '../types';
import { getFriendlyErrorMessage } from '../lib/utils';

interface StartScreenProps {
  onStart: (details: { box: BoxItem, logo: File }) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido (PNG, JPG, etc.).');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const handleGenerateClick = () => {
    if (logoFile) {
        onStart({ box: defaultBox, logo: logoFile });
    } else {
        setError("Por favor, sube un logo primero.");
    }
  }

  const screenVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      key="mockup-starter"
      className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-8"
      variants={screenVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
          Visualiza Tu Marca.
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Mira tu logo en nuestra caja de regalo premium en segundos. Solo sube tu logo y deja que nuestra IA cree una maqueta impresionante y realista para ti.
        </p>
      </div>

      <div className="w-full p-8 bg-white rounded-2xl shadow-lg border border-gray-200/80">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Step 1: Box Display (Static) */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 text-white bg-gray-800 rounded-full font-sans text-sm">1</span>
              Caja Base Seleccionada
            </h2>
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                <img src={defaultBox.url} alt={defaultBox.name} className="w-48 h-48 object-contain" />
                <p className="mt-4 font-semibold text-gray-800">{defaultBox.name}</p>
            </div>
          </div>
          
          {/* Step 2: Logo Upload */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 text-white bg-gray-800 rounded-full font-sans text-sm">2</span>
              Sube Tu Logo
            </h2>
            {logoPreview ? (
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center p-4">
                    <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain"/>
                    <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} className="absolute top-2 right-2 bg-white/80 text-gray-700 rounded-full p-1 text-xs font-semibold hover:bg-white">Cambiar</button>
                </div>
            ) : (
                <label htmlFor="logo-upload" className="relative w-full aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-600 cursor-pointer bg-gray-50/50">
                    <UploadCloudIcon className="w-8 h-8 mb-2"/>
                    <span className="text-sm font-semibold text-center">Haz clic para subir</span>
                    <span className="text-xs text-center mt-1">PNG, JPG, WEBP</span>
                    <input id="logo-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
                </label>
            )}
          </div>
        </div>

        {/* Action Button & Error */}
        <div className="mt-8 flex flex-col items-center">
            <button
                onClick={handleGenerateClick}
                disabled={!logoFile}
                className="w-full max-w-xs relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer group hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                Generar Maqueta &rarr;
            </button>
            {error && <p className="text-red-500 text-sm mt-4">{getFriendlyErrorMessage(error, "Error")}</p>}
        </div>
      </div>
    </motion.div>
  );
};

export default StartScreen;