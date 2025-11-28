import { mockRefAtenuacao, mockUsers, mockConstantesVdi, mockPrecosCaixa, mockPrecosBaffle } from '../db/mock_db';
import { RefAtenuacao, User, ConstantesVdiPerdaCarga, PrecoUnitarioCaixa, PrecoUnitarioBaffle } from '../types/schema';

const DELAY_MS = 300;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  health: async () => {
    await delay(DELAY_MS);
    return { status: "ok", timestamp: new Date().toISOString() };
  },

  users: {
    list: async (): Promise<User[]> => {
      await delay(DELAY_MS);
      return [...mockUsers];
    }
  },

  data: {
    getRefAtenuacao: async (): Promise<RefAtenuacao[]> => {
      await delay(DELAY_MS);
      return [...mockRefAtenuacao];
    },
    
    getConstantesVdi: async (): Promise<ConstantesVdiPerdaCarga[]> => {
      await delay(DELAY_MS);
      return [...mockConstantesVdi];
    },

    getPrecosCaixa: async (): Promise<PrecoUnitarioCaixa[]> => {
      await delay(DELAY_MS);
      return [...mockPrecosCaixa];
    },

    getPrecosBaffle: async (): Promise<PrecoUnitarioBaffle[]> => {
      await delay(DELAY_MS);
      return [...mockPrecosBaffle];
    }
  }
};
