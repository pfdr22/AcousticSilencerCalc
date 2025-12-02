import { mockRefAtenuacao, mockUsers, mockConstantesVdi, mockPrecosCaixa, mockPrecosBaffle } from '../db/mock_db';
import { RefAtenuacao, User, ConstantesVdiPerdaCarga, PrecoUnitarioCaixa, PrecoUnitarioBaffle } from '../types/schema';

const DELAY_MS = 300;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory store for users to simulate persistence during session
let usersStore = [...mockUsers];

export const api = {
  health: async () => {
    await delay(DELAY_MS);
    return { status: "ok", timestamp: new Date().toISOString() };
  },

  users: {
    list: async (): Promise<User[]> => {
      await delay(DELAY_MS);
      return usersStore.map(({ passwordHash, ...u }) => u); // Return without password
    },
    create: async (user: Omit<User, 'id'> & { passwordHash: string }): Promise<User> => {
      await delay(DELAY_MS);
      const newUser = { ...user, id: usersStore.length + 1 };
      usersStore.push(newUser);
      const { passwordHash, ...safeUser } = newUser;
      return safeUser;
    },
    update: async (id: number, data: Partial<User>): Promise<User> => {
      await delay(DELAY_MS);
      const index = usersStore.findIndex(u => u.id === id);
      if (index === -1) throw new Error("User not found");
      usersStore[index] = { ...usersStore[index], ...data };
      const { passwordHash, ...safeUser } = usersStore[index];
      return safeUser;
    },
    checkCredentials: async (email: string, pass: string): Promise<User | null> => {
      await delay(DELAY_MS);
      const user = usersStore.find(u => u.email === email && u.passwordHash === pass && u.active);
      if (!user) return null;
      const { passwordHash, ...safeUser } = user;
      return safeUser;
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
