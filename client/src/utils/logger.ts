// Logger para o frontend - versão simplificada
export class ClientLogger {
  private static isDevelopment = import.meta.env.DEV;

  static info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`ℹ️ [${new Date().toISOString()}] ${message}`, data || '');
    }
  }

  static success(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`✅ [${new Date().toISOString()}] ${message}`, data || '');
    }
  }

  static error(message: string, error?: any): void {
    console.error(`❌ [${new Date().toISOString()}] ${message}`, error || '');
  }

  static warn(message: string, data?: any): void {
    console.warn(`⚠️ [${new Date().toISOString()}] ${message}`, data || '');
  }

  static debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`🐛 [${new Date().toISOString()}] ${message}`, data || '');
    }
  }

  // Método para ações do usuário (sempre ativo para analytics)
  static userAction(action: string, data?: any): void {
    console.log(`👤 [${new Date().toISOString()}] Ação do usuário: ${action}`, data || '');
    
    // Aqui você pode enviar para analytics (Google Analytics, Mixpanel, etc.)
    // analytics.track(action, data);
  }
}