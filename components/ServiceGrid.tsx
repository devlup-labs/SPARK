"use client";

import { motion } from "framer-motion";
import {
  Cloud,
  MonitorPlay,
  Activity,
  BarChart3,
  Shield,
  Network,
  LucideIcon,
} from "lucide-react";
import ServiceCard, { ServiceCardProps } from "./ServiceCard";

// Service configuration - easily extendable
export const sparkServices: ServiceCardProps[] = [
  {
    id: "cloud",
    title: "Cloud",
    subtitle: "Storage Service",
    description:
      "Your personal cloud storage — files, contacts and more, all self-hosted and private.",
    icon: Cloud,
    category: "STORAGE",
    port: ":4001",
    accentColor: "#00f5ff", // cyan
    href: "/cloud",
    isExternal: false,
  },
  {
    id: "media",
    title: "Media",
    subtitle: "Custom Media Service",
    description:
      "Stream your entire media library — movies, shows, music — to any device, anywhere.",
    icon: MonitorPlay,
    category: "STREAMING",
    port: ":4002",
    accentColor: "#f97316", // orange
    href: "/media",
    isExternal: false,
  },
  {
    id: "devices",
    title: "Devices",
    subtitle: "Monitoring Service",
    description:
      "Real-time monitoring of all connected devices, hardware health and network status.",
    icon: Activity,
    category: "MONITORING",
    port: ":9090",
    accentColor: "#ef4444", // red
    href: "/devices",
    isExternal: false,
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "Metrics Stack",
    description:
      "Dashboards powered by Prometheus & Grafana — CPU, memory, disk and network metrics.",
    icon: BarChart3,
    category: "METRICS",
    port: ":3001",
    accentColor: "#00f5ff", // cyan
    href: "/analytics",
    isExternal: false,
  },
  {
    id: "admin",
    title: "Admin",
    subtitle: "Admin Service",
    description:
      "Central control panel for your homelab — manage apps, storage and users from one place.",
    icon: Shield,
    category: "CONTROL",
    port: ":4003",
    accentColor: "#f97316", // orange
    href: "/admin",
    isExternal: false,
  },
  {
    id: "services",
    title: "Services",
    subtitle: "Reverse Proxy Overview",
    description:
      "Nginx Proxy Manager overview — all running services, domains and SSL certificates at a glance.",
    icon: Network,
    category: "NETWORK",
    port: ":8081",
    accentColor: "#ef4444", // red
    href: "/services",
    isExternal: false,
  },
];

interface ServiceGridProps {
  services?: ServiceCardProps[];
  title?: string;
  subtitle?: string;
}

const containerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function ServiceGrid({
  services = sparkServices,
  title = "Spark Services",
  subtitle = "Your self-hosted infrastructure at a glance",
}: ServiceGridProps) {
  return (
    <section className="w-full">
      {/* Section Header */}
      {title && (
        <div className="mb-8">
          <h2 className="font-syne text-2xl md:text-3xl font-bold text-white/90 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-white/40">{subtitle}</p>
          )}
        </div>
      )}

      {/* Service Cards Grid */}
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <ServiceCard {...service} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
