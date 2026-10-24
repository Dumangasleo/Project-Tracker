import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  configureFieldEncryption,
  emailLookupHash,
  ENCRYPTED_PREFIX,
} from '../../common/security/field-encryption';
import type { ApiEnv } from '../../config/env.validation';
import { ExternalIdentity } from '../auth/entities/external-identity.entity';
import { TeamMember } from '../team/entities/team-member.entity';

/** Encrypts rows that were saved before field encryption existed. Safe to run on every start. */
@Injectable()
export class DataProtectionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DataProtectionService.name);

  constructor(
    config: ConfigService<ApiEnv, true>,
    @InjectRepository(TeamMember)
    private readonly members: Repository<TeamMember>,
    @InjectRepository(ExternalIdentity)
    private readonly identities: Repository<ExternalIdentity>,
  ) {
    configureFieldEncryption(
      config.get('DATA_ENCRYPTION_KEY', { infer: true }),
    );
  }

  async onApplicationBootstrap(): Promise<void> {
    const members = await this.encryptLegacyMembers();
    const identities = await this.encryptLegacyIdentities();
    if (members + identities > 0) {
      this.logger.log(
        `Encrypted personal data of ${members} member(s) and ${identities} linked identity(ies).`,
      );
    }
  }

  async encryptLegacyMembers(): Promise<number> {
    const legacy = await this.members.find({
      where: { emailHash: IsNull() },
      select: { id: true, email: true, contactNumber: true, address: true },
    });

    for (const member of legacy) {
      await this.members.update(member.id, {
        email: member.email,
        emailHash: emailLookupHash(member.email),
        contactNumber: member.contactNumber,
        address: member.address,
      });
    }
    return legacy.length;
  }

  async encryptLegacyIdentities(): Promise<number> {
    const legacy = await this.identities
      .createQueryBuilder('identity')
      .select(['identity.id', 'identity.email'])
      .where('identity.email NOT LIKE :prefix', {
        prefix: `${ENCRYPTED_PREFIX}%`,
      })
      .getMany();

    for (const identity of legacy) {
      await this.identities.update(identity.id, { email: identity.email });
    }
    return legacy.length;
  }
}
