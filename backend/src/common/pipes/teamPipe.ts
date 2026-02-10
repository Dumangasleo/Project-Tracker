import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseTeamMemberPipe implements PipeTransform {
    // Ang 'value' ay ang data na galing sa request (@Body)
    transform(value: any, metadata: ArgumentMetadata) {
        if (typeof value !== 'object') {
            return value;
        }

        // Halimbawa: I-auto-capitalize ang pangalan bago i-save sa DB
        if (value.FirstName) {
            value.FirstName = value.FirstName.charAt(0).toUpperCase() + value.FirstName.slice(1);
        }

        if (value.LastName) {
            value.LastName = value.LastName.charAt(0).toUpperCase() + value.LastName.slice(1);
        }

        // Maaari ka ring mag-throw ng error dito
        if (value.Email && !value.Email.includes('@')) {
            throw new BadRequestException('Invalid internal email format');
        }

        return value;
    }
}