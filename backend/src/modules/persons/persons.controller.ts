import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('persons')
@Controller('persons')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Create a new person' })
  @ApiResponse({ status: 201, description: 'Person created successfully' })
  create(
    @Body() createPersonDto: CreatePersonDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.personsService.create(createPersonDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all persons' })
  @ApiResponse({ status: 200, description: 'Persons retrieved successfully' })
  findAll() {
    return this.personsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a person by ID' })
  @ApiResponse({ status: 200, description: 'Person retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  findOne(@Param('id') id: string) {
    return this.personsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'advisor', 'operations')
  @ApiOperation({ summary: 'Update a person' })
  @ApiResponse({ status: 200, description: 'Person updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updatePersonDto: UpdatePersonDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.personsService.update(id, updatePersonDto, userId);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete a person (SEC compliance)' })
  @ApiResponse({ status: 200, description: 'Person soft deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.personsService.remove(id, userId);
  }
}
