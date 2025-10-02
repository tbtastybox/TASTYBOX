/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface BoxItem {
  id: string;
  name: string;
  url: string;
}

export interface GeneratedImageHistory {
  // Maps angle instruction to image URL
  [angle: string]: string;
}

// Fix: Add missing WardrobeItem type
export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

// Fix: Add missing OutfitLayer type
export interface OutfitLayer {
  garment?: WardrobeItem;
}
