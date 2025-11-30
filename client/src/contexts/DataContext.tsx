import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRICING_DB } from '@/core/pricing_db';
import { mockRefAtenuacao } from '@/db/mock_db'; // Import attenuation data

export interface AppData {
  pricing: typeof PRICING_DB;
  attenuation: typeof mockRefAtenuacao;
  constants: {
    pressure_loss: {
      a1: number; a2: number; b1: number; b2: number;
      aerodynamic_factor: number;
    }
  }
}

interface DataContextType {
  data: AppData;
  updatePricing: (section: 'materials' | 'labor' | 'factors', key: string, value: number) => void;
  updateAttenuation: (id: number, value: number) => void; // Simplified update
  updateConstant: (section: 'pressure_loss', key: string, value: number) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({
    pricing: JSON.parse(JSON.stringify(PRICING_DB)), 
    attenuation: JSON.parse(JSON.stringify(mockRefAtenuacao)),
    constants: {
      pressure_loss: { a1: 0, a2: 0, b1: 0, b2: 0, aerodynamic_factor: 0.5 } 
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem('app_data_v1');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration for old data structure if needed
      if (!parsed.constants?.pressure_loss?.aerodynamic_factor) {
        if (!parsed.constants) parsed.constants = {};
        if (!parsed.constants.pressure_loss) parsed.constants.pressure_loss = { a1: 0, a2: 0, b1: 0, b2: 0 };
        parsed.constants.pressure_loss.aerodynamic_factor = 0.5;
      }
      setData(parsed);
    }
  }, []);

  const saveToStorage = (newData: AppData) => {
    localStorage.setItem('app_data_v1', JSON.stringify(newData));
    setData(newData);
  };

  const updatePricing = (section: 'materials' | 'labor' | 'factors', key: string, value: number) => {
    const newData = { ...data };
    // @ts-ignore
    newData.pricing[section][key] = value;
    saveToStorage(newData);
  };

  const updateAttenuation = (id: number, value: number) => {
     const newData = { ...data };
     const index = newData.attenuation.findIndex((item: { id: number }) => item.id === id);
     if (index !== -1) {
       newData.attenuation[index].d_ref_db = value;
       saveToStorage(newData);
     }
  };

  const updateConstant = (section: 'pressure_loss', key: string, value: number) => {
    const newData = { ...data };
    // @ts-ignore
    newData.constants[section][key] = value;
    saveToStorage(newData);
  };

  const resetData = () => {
    const newData = {
      pricing: JSON.parse(JSON.stringify(PRICING_DB)),
      attenuation: JSON.parse(JSON.stringify(mockRefAtenuacao)),
      constants: {
        pressure_loss: { a1: 0, a2: 0, b1: 0, b2: 0, aerodynamic_factor: 0.5 } 
      }
    };
    saveToStorage(newData);
  };

  return (
    <DataContext.Provider value={{ data, updatePricing, updateAttenuation, updateConstant, resetData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}


