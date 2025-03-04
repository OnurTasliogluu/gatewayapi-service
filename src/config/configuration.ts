import { registerAs } from '@nestjs/config';

export interface ServiceConfig {
  name: string;
  host: string;
  port: number;
}

export default registerAs('gateway', () => {
  const serviceEntries = process.env.SERVICE_MAP?.split(',') || [];

  return {
    services: serviceEntries.reduce((acc, entry) => {
      const [name, host, port] = entry.split(/[=:]/);
      if (name && host && port) {
        acc.push({
          name: name.trim(),
          host: host.trim(),
          port: parseInt(port.trim(), 10),
        });
      }
      return acc;
    }, [] as ServiceConfig[]),
    port: parseInt(process.env.GATEWAY_PORT || '3000', 10),
  };
});
