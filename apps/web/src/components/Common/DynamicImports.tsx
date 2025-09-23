import dynamic from 'next/dynamic';
import React from 'react';

// Dynamic imports for heavy components to reduce initial bundle size

// Maps
export const DynamicGoogleMap = dynamic(() => import('@react-google-maps/api').then(mod => ({ default: mod.GoogleMap })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Loading map...</div>,
});

export const DynamicMapboxMap = dynamic(() => import('@/components/world/MapboxWorldHubMap'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Loading map...</div>,
});

// Editor
export const DynamicReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Loading editor...</div>,
});

// Charts (if needed in future)
export const DynamicRecharts = dynamic(() => import('recharts'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Loading chart...</div>,
});

// Animation components
export const DynamicFramerMotion = dynamic(() => import('framer-motion'), {
  ssr: false,
  loading: () => <div>Loading animation...</div>,
});

// Heavy UI components
export const DynamicCMSDashboard = dynamic(() => import('@/components/CMS').then(mod => ({ default: mod.CMSDashboard })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Loading CMS...</div>,
});

export const DynamicPerformanceDashboard = dynamic(() => import('@/components/Dashboard/PerformanceDashboard').then(mod => ({ default: mod.PerformanceDashboard })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">Loading performance dashboard...</div>,
});

// Image crop component
export const DynamicImageCrop = dynamic(() => import('react-image-crop'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-32">Loading image editor...</div>,
});
