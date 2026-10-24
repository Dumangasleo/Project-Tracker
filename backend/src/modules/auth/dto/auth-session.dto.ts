import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TeamMember } from '../../team/entities/team-member.entity';
import type { AuthSession } from '../interfaces/session.interfaces';

export class SessionUserDto {
  @ApiProperty() id: number;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiPropertyOptional({ type: String, nullable: true }) avatar: string | null;
  @ApiProperty() positionId: number;

  static from(member: TeamMember): SessionUserDto {
    return {
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      avatar: member.avatar,
      positionId: member.positionId,
    };
  }
}

export class AuthSessionDto {
  @ApiProperty() accessToken: string;
  @ApiProperty({ description: 'Access token lifetime in seconds.' })
  expiresIn: number;
  @ApiProperty({ type: SessionUserDto }) user: SessionUserDto;

  static from(session: AuthSession): AuthSessionDto {
    return {
      accessToken: session.tokens.accessToken,
      expiresIn: session.tokens.expiresIn,
      user: SessionUserDto.from(session.member),
    };
  }
}
