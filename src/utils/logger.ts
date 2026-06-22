export class Logger {
  public info(message: string, ...meta: any[]): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...meta);
  }

  public warn(message: string, ...meta: any[]): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...meta);
  }

  public error(message: string, ...meta: any[]): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...meta);
  }
}

export const logger = new Logger();
export default logger;
