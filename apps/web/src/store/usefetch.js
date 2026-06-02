import { create } from "zustand";
import { persist } from "zustand/middleware";


const useCarritoBasicoStore = create(persist(
    (set) => ({
        items : ["linda"],

        agregar : (items) => set((estado) => ({
            items: [...estado.items, items],
        })),

        vaciar: () => set({ items: []}),
    })
))

// persist = guarada el estado en localStorage es un almacen de clave valor que el navegador guarda en el disco. los datos persite aunque el usuario cierre la pestaña o el navegador

const useCarritoStore = create(persist(
    (set) => ({
        items: [],
        agregar: (item) => set((estado) => ({ items: [...estado.items, item]}))
    }),
    {
        
    }
))