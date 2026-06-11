import os from "os";
import fs from "fs";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Memory
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memPercentage = (usedMem / totalMem) * 100;

        // Uptime
        const uptime = os.uptime();

        // CPU Usage — load average as percentage of total cores
        const cpus = os.cpus();
        const loadAvg = os.loadavg();
        let cpuPercentage = (loadAvg[0] / cpus.length) * 100;
        cpuPercentage = Math.min(Math.max(cpuPercentage, 0), 100);

        // Storage
        let storageTotal = 512;
        let storageUsed = 124.5;
        let storagePercentage = 24;
        try {
            const stat = fs.statfsSync("/");
            storageTotal = (stat.blocks * stat.bsize) / (1024 ** 3);
            const storageFree = (stat.bavail * stat.bsize) / (1024 ** 3);
            storageUsed = storageTotal - storageFree;
            storagePercentage = (storageUsed / storageTotal) * 100;
        } catch (e) {
            console.error("Failed to read fs statfs", e);
        }

        // Temperature — read from Linux thermal zones
        let tempValue = "N/A";
        let tempPercentage = 0;
        try {
            const thermalPaths = [
                "/sys/class/thermal/thermal_zone0/temp",
                "/sys/class/thermal/thermal_zone1/temp",
            ];
            for (const tp of thermalPaths) {
                if (fs.existsSync(tp)) {
                    const raw = fs.readFileSync(tp, "utf8").trim();
                    const tempC = parseInt(raw, 10) / 1000;
                    tempValue = `${tempC.toFixed(1)}°C`;
                    // Scale: 0°C = 0%, 100°C = 100%
                    tempPercentage = Math.min(100, Math.max(0, tempC));
                    break;
                }
            }
        } catch (e) {
            console.error("Failed to read temperature", e);
        }

        // Network — read real RX/TX from /proc/net/dev
        let networkValue = "Active";
        let networkPercentage = 30;
        try {
            if (fs.existsSync("/proc/net/dev")) {
                const raw = fs.readFileSync("/proc/net/dev", "utf8");
                const lines = raw.split("\n").slice(2); // Skip header lines
                let totalRx = 0;
                let totalTx = 0;
                for (const line of lines) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length < 10) continue;
                    const iface = parts[0].replace(":", "");
                    if (iface === "lo") continue; // Skip loopback
                    totalRx += parseInt(parts[1], 10) || 0;
                    totalTx += parseInt(parts[9], 10) || 0;
                }
                const totalGB = ((totalRx + totalTx) / (1024 ** 3));
                networkValue = totalGB >= 1 ? `${totalGB.toFixed(1)} GB` : `${(totalGB * 1024).toFixed(0)} MB`;
                // Rough percentage based on 100GB scale
                networkPercentage = Math.min(100, (totalGB / 100) * 100);
            }
        } catch (e) {
            console.error("Failed to read network data", e);
        }
        // Active Network Interfaces
        let activeIp = "127.0.0.1";
        let activeIface = "lo";
        try {
            const interfaces = os.networkInterfaces();
            for (const name of Object.keys(interfaces)) {
                for (const netInfo of interfaces[name] || []) {
                    if (netInfo.family === "IPv4" && !netInfo.internal) {
                        activeIp = netInfo.address;
                        activeIface = name;
                        break;
                    }
                }
                if (activeIp !== "127.0.0.1") break;
            }
        } catch (e) {
            console.error("Failed to read network interfaces", e);
        }

        return NextResponse.json({
            uptime,
            memory: {
                total: totalMem,
                free: freeMem,
                used: usedMem,
                percentage: memPercentage
            },
            cpu: {
                percentage: cpuPercentage,
                cores: cpus.length,
                model: cpus[0].model
            },
            storage: {
                total: storageTotal,
                used: storageUsed,
                percentage: storagePercentage
            },
            network: {
                percentage: networkPercentage,
                value: networkValue,
                ip: activeIp,
                interface: activeIface
            },
            temperature: {
                percentage: tempPercentage,
                value: tempValue
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to read system stats" }, { status: 500 });
    }
}
