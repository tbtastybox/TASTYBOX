/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import { BoxItem } from '../types';
import { PlusIcon } from './icons';

interface ControlPanelProps {
  selectedBox: BoxItem;
  logoFile: File;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ selectedBox, logoFile }) => {
  const logoUrl = useMemo(() => URL.createObjectURL(logoFile), [logoFile]);

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 border-b border-gray-400/50 pb-2 mb-4">Tu Maqueta</h2>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">Esta es una combinación de la caja y el logo que seleccionaste. Usa los controles en la imagen para ver diferentes ángulos.</p>
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-100/60 rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <img src={selectedBox.url} alt={selectedBox.name} className="w-20 h-20 object-cover rounded-md border border-gray-200" />
            <span className="text-xs font-semibold text-gray-700 text-center">{selectedBox.name}</span>
          </div>
          <PlusIcon className="w-6 h-6 text-gray-400 flex-shrink-0" />
          <div className="flex flex-col items-center gap-2">
            <img src={logoUrl} alt={logoFile.name} className="w-20 h-20 object-contain rounded-md p-1 border border-gray-200 bg-white" />
            <span className="text-xs font-medium text-gray-700 text-center truncate w-20" title={logoFile.name}>{logoFile.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;