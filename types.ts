import React from 'react';

export interface ButtonConfig {
  id: string;
  name: string;
  url: string;
  description: string;
  // Generated style properties
  className: string; 
  iconName: string;
  category?: string;
}

export interface AppConfig {
  siteTitle: string;
  buttons: ButtonConfig[];
}
