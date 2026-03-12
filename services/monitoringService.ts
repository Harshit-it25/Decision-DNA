export const monitoringService = {
  interval: null as any,
  start: (onTick: () => void) => {
    console.log("Monitoring service started...");
    // Simulate a check every 30 seconds
    monitoringService.interval = setInterval(() => {
      onTick();
    }, 30000);
  },
  stop: () => {
    console.log("Monitoring service stopped.");
    if (monitoringService.interval) {
      clearInterval(monitoringService.interval);
    }
  }
};
