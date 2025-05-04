import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PremiumService } from "./premium.service";
import { PREMIUM_ROLE_NAME } from "./decorators/premium.decorator";
import { PremiumRequiredException } from "./exceptions/premium-required.exception";

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly premiumService: PremiumService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const role = this.reflector.get<string>('role', context.getHandler());
    
    if (role !== PREMIUM_ROLE_NAME) {
      return Promise.resolve(true);
    }

    const request = context.switchToHttp().getRequest();

    if (!request.params || !request.params.akey) {
      throw new ForbiddenException('Missing AKey');
    }

    const expiryDate = await this.premiumService.getExpiryDate(request.params.akey);

    if (expiryDate == null) {
      throw new PremiumRequiredException();
    }

     return Promise.resolve(true);
  }
}