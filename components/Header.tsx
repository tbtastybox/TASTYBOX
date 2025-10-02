/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { BoxIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="w-full py-5 px-4 md:px-8 bg-white sticky top-0 z-40">
      <div className="flex items-center gap-3">
          <BoxIcon className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-serif tracking-widest text-gray-800">
            Maqueta de Caja Gourmet
          </h1>
      </div>
    </header>
  );
};

export default Header;