"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconCheck, IconAlertTriangle, IconInfoCircle, IconX } from "@tabler/icons-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000); // 4 seconds
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const colors = {
                            success: { bg: "rgba(0, 245, 255, 0.1)", border: "rgba(0, 245, 255, 0.4)", text: "#00f5ff", icon: <IconCheck size={18} /> },
                            error: { bg: "rgba(255, 32, 32, 0.1)", border: "rgba(255, 32, 32, 0.4)", text: "#ff2020", icon: <IconAlertTriangle size={18} /> },
                            warning: { bg: "rgba(255, 106, 0, 0.1)", border: "rgba(255, 106, 0, 0.4)", text: "#ff6a00", icon: <IconAlertTriangle size={18} /> },
                            info: { bg: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.2)", text: "#ffffff", icon: <IconInfoCircle size={18} /> },
                        };
                        const theme = colors[toast.type] || colors.info;

                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, x: 50 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg backdrop-blur-md pointer-events-auto"
                                style={{
                                    background: theme.bg,
                                    border: `1px solid ${theme.border}`,
                                    boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 0 16px ${theme.bg}`,
                                    minWidth: "280px"
                                }}
                            >
                                <div style={{ color: theme.text }}>{theme.icon}</div>
                                <p className="flex-1 text-sm font-medium tracking-wide" style={{ color: "var(--text-primary)", fontFamily: "var(--font-dm-sans)" }}>
                                    {toast.message}
                                </p>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                    style={{ color: "var(--text-secondary)" }}
                                >
                                    <IconX size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
