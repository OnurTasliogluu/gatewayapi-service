export interface MicroserviceRequest {
  service: string;
  pattern: Record<string, any>;
  data: any;
}
