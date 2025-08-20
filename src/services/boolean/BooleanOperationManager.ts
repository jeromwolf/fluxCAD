import { BooleanOperationType, BooleanOperationProvider, BooleanOperationResult } from '@/types/boolean'

// Boolean 연산 매니저 - 여러 프로바이더를 관리
export class BooleanOperationManager {
  private providers: Map<string, BooleanOperationProvider> = new Map()
  private activeProvider: BooleanOperationProvider | null = null

  // 프로바이더 등록
  registerProvider(provider: BooleanOperationProvider): void {
    this.providers.set(provider.name, provider)
    
    // 사용 가능한 첫 번째 프로바이더를 활성화
    if (!this.activeProvider && provider.isAvailable()) {
      this.activeProvider = provider
    }
  }

  // 활성 프로바이더 설정
  setActiveProvider(name: string): boolean {
    const provider = this.providers.get(name)
    if (provider && provider.isAvailable()) {
      this.activeProvider = provider
      return true
    }
    return false
  }

  // 사용 가능한 프로바이더 목록
  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isAvailable())
      .map(([name, _]) => name)
  }

  // Boolean 연산 수행
  async performOperation(
    geometryA: any,
    geometryB: any,
    operation: BooleanOperationType
  ): Promise<BooleanOperationResult> {
    if (!this.activeProvider) {
      return {
        success: false,
        error: 'No boolean operation provider available'
      }
    }

    try {
      return await this.activeProvider.performOperation(geometryA, geometryB, operation)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // 현재 활성 프로바이더 이름
  getActiveProviderName(): string | null {
    return this.activeProvider?.name || null
  }
}

// 싱글톤 인스턴스
export const booleanOperationManager = new BooleanOperationManager()