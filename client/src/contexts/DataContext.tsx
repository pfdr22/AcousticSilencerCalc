import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRICING_DB } from '@/core/pricing_db'; // Keep for migration or fallback
import { mockRefAtenuacao, mockPrecosCaixa, mockPrecosBaffle } from '@/db/mock_db';
import { PrecoUnitarioCaixa, PrecoUnitarioBaffle, RefAtenuacao } from '@/types/schema';

export interface AppData {
  // New Pricing Structure
  pricing_caixa: PrecoUnitarioCaixa[];
  pricing_baffle: PrecoUnitarioBaffle[];
  
  // Legacy Pricing (kept to avoid breaking changes during migration if referenced elsewhere, though we should remove usage)
  pricing: typeof PRICING_DB; 
  
  attenuation: RefAtenuacao[];
  constants: {
    pressure_loss: {
      a1: number; a2: number; b1: number; b2: number;
      aerodynamic_factor: number;
    }
  }
}

interface DataContextType {
  data: AppData;
  updatePrecoCaixa: (id: number, value: number) => void;
  updatePrecoBaffle: (id: number, value: number) => void;
  updateAttenuation: (id: number, value: number) => void;
  updateConstant: (section: 'pressure_loss', key: string, value: number) => void;
  resetData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({
    pricing_caixa: JSON.parse(JSON.stringify(mockPrecosCaixa)),
    pricing_baffle: JSON.parse(JSON.stringify(mockPrecosBaffle)),
    pricing: JSON.parse(JSON.stringify(PRICING_DB)), 
    attenuation: JSON.parse(JSON.stringify(mockRefAtenuacao)),
    constants: {
      pressure_loss: { a1: 0, a2: 0, b1: 0, b2: 0, aerodynamic_factor: 0.5 } 
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem('app_data_v2'); // Bump version to v2
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure structure integrity for v2
      if (!parsed.pricing_caixa) parsed.pricing_caixa = JSON.parse(JSON.stringify(mockPrecosCaixa));
      if (!parsed.pricing_baffle) parsed.pricing_baffle = JSON.parse(JSON.stringify(mockPrecosBaffle));
      if (!parsed.constants?.pressure_loss?.aerodynamic_factor) {
         if (!parsed.constants) parsed.constants = {};
         if (!parsed.constants.pressure_loss) parsed.constants.pressure_loss = { a1: 0, a2: 0, b1: 0, b2: 0 };
         parsed.constants.pressure_loss.aerodynamic_factor = 0.5;
      }
      setData(parsed);
    } else {
      // Try migrating from v1? Or just clean start. 
      // Given it's a prototype, let's check v1 just in case, but v2 structure is different.
      // Let's stick to defaults if v2 not found.
    }
  }, []);

  const saveToStorage = (newData: AppData) => {
    localStorage.setItem('app_data_v2', JSON.stringify(newData));
    setData(newData);
  };

  const updatePrecoCaixa = (id: number, value: number) => {
    const newData = { ...data };
    const index = newData.pricing_caixa.findIndex(i => i.id === id);
    if (index !== -1) {
      newData.pricing_caixa[index].valor = value;
      saveToStorage(newData);
    }
  };

  const updatePrecoBaffle = (id: number, value: number) => {
    const newData = { ...data };
    const index = newData.pricing_baffle.findIndex(i => i.id === id);
    if (index !== -1) {
      newData.pricing_baffle[index].valor = value;
      saveToStorage(newData);
    }
  };

  const updateAttenuation = (id: number, value: number) => {
     const newData = { ...data };
     const index = newData.attenuation.findIndex(item => item.id === id);
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
      pricing_caixa: JSON.parse(JSON.stringify(mockPrecosCaixa)),
      pricing_baffle: JSON.parse(JSON.stringify(mockPrecosBaffle)),
      pricing: JSON.parse(JSON.stringify(PRICING_DB)),
      attenuation: JSON.parse(JSON.stringify(mockRefAtenuacao)),
      constants: {
        pressure_loss: { a1: 0, a2: 0, b1: 0, b2: 0, aerodynamic_factor: 0.5 } 
      }
    };
    saveToStorage(newData);
  };

  return (
    <DataContext.Provider value={{ 
      data, 
      updatePrecoCaixa, 
      updatePrecoBaffle, 
      updateAttenuation, 
      updateConstant, 
      resetData 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
