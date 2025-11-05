import { PartialType } from '@nestjs/swagger';
import { CreatePantryItemDto } from './create-pantry-item.dto';

export class UpdatePantryItemDto extends PartialType(CreatePantryItemDto) {}
