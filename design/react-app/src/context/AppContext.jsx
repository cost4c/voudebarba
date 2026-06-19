import { createContext, useContext, useState, useRef, useCallback } from 'react';
import db from '../data/db.json';
import { isoLocal, addDays } from '../utils/format.js';

const AppContext = createContext(null);

// Clona os dados fictícios e converte os offsets de dia em datas reais,
// para o MVP sempre mostrar agendamentos "de hoje".
function seedShops() {
  return JSON.parse(JSON.stringify(db.shops));
}
function seedAppts() {
  return db.appointments.map(({ dayOffset, ...rest }) => ({
    ...rest,
    date: isoLocal(addDays(dayOffset)),
  }));
}

// Barbearia "dona" do painel (role barbearia). Num app real viria do login.
const CURRENT_SHOP_ID = 1;

export function AppProvider({ children }) {
  const [role, setRole] = useState('cliente');
  const [user, setUser] = useState(null);
  const [shops, setShops] = useState(seedShops);
  const [appts, setAppts] = useState(seedAppts);
  const [toast, setToast] = useState('');
  const [pendingBooking, setPendingBooking] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3200);
  }, []);

  const login = useCallback((u) => setUser(u), []);
  const logout = useCallback(() => {
    setUser(null);
    setRole('cliente');
  }, []);

  const findShop = useCallback((id) => shops.find((s) => s.id === id), [shops]);

  const addAppointment = useCallback((booking) => {
    setAppts((prev) => {
      const id = Math.max(100, ...prev.map((a) => a.id)) + 1;
      return [...prev, { id, client: 'Você', status: 'agendado', ...booking }];
    });
    setRole('cliente');
  }, []);

  const setStatus = useCallback((id, status) => {
    setAppts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  // Mutações sempre na barbearia atual (painel do dono).
  const updateCurrentShop = useCallback((patch) => {
    setShops((prev) => prev.map((sh) => (sh.id === CURRENT_SHOP_ID ? { ...sh, ...patch } : sh)));
  }, []);

  const addService = useCallback((form) => {
    setShops((prev) =>
      prev.map((sh) => {
        if (sh.id !== CURRENT_SHOP_ID) return sh;
        const id = Math.max(0, ...sh.services.map((x) => x.id)) + 1;
        return {
          ...sh,
          services: [
            ...sh.services,
            { id, nome: form.nome.trim(), desc: '', preco: Number(form.preco) || 0, dur: Number(form.dur) || 30, ativo: true },
          ],
        };
      })
    );
  }, []);

  const removeService = useCallback((sid) => {
    setShops((prev) =>
      prev.map((sh) => (sh.id === CURRENT_SHOP_ID ? { ...sh, services: sh.services.filter((x) => x.id !== sid) } : sh))
    );
  }, []);

  const addBarber = useCallback((nome) => {
    setShops((prev) =>
      prev.map((sh) => {
        if (sh.id !== CURRENT_SHOP_ID) return sh;
        const id = Math.max(0, ...sh.barbers.map((x) => x.id)) + 1;
        return { ...sh, barbers: [...sh.barbers, { id, nome: nome.trim(), espec: 'Barbeiro' }] };
      })
    );
  }, []);

  const removeBarber = useCallback((bid) => {
    setShops((prev) =>
      prev.map((sh) => (sh.id === CURRENT_SHOP_ID ? { ...sh, barbers: sh.barbers.filter((x) => x.id !== bid) } : sh))
    );
  }, []);

  const toggleHor = useCallback((dw) => {
    setShops((prev) =>
      prev.map((sh) =>
        sh.id === CURRENT_SHOP_ID
          ? { ...sh, horarios: { ...sh.horarios, [dw]: { ...sh.horarios[dw], on: !sh.horarios[dw].on } } }
          : sh
      )
    );
  }, []);

  const setHor = useCallback((dw, field, value) => {
    setShops((prev) =>
      prev.map((sh) =>
        sh.id === CURRENT_SHOP_ID
          ? { ...sh, horarios: { ...sh.horarios, [dw]: { ...sh.horarios[dw], [field]: value } } }
          : sh
      )
    );
  }, []);

  const value = {
    role, setRole,
    user, login, logout,
    shops, findShop,
    appts, addAppointment, setStatus,
    toast, showToast,
    pendingBooking, setPendingBooking,
    currentShopId: CURRENT_SHOP_ID,
    updateCurrentShop, addService, removeService, addBarber, removeBarber, toggleHor, setHor,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return ctx;
}
