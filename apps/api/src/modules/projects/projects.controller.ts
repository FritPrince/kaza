import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createProjectSchema,
  createRoomSchema,
  updateProjectSchema,
  type CreateProjectInput,
  type CreateRoomInput,
  type UpdateProjectInput,
} from '@kaza/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Dashboard: list projects with thumbnail and progress (E2)' })
  list(@CurrentUserId() userId: string) {
    return this.projectsService.listProjects(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a project (E1)' })
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createProjectSchema)) input: CreateProjectInput,
  ) {
    return this.projectsService.createProject(userId, input);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Project detail with rooms' })
  get(@CurrentUserId() userId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getProject(userId, projectId);
  }

  @Patch(':projectId')
  update(
    @CurrentUserId() userId: string,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) input: UpdateProjectInput,
  ) {
    return this.projectsService.updateProject(userId, projectId, input);
  }

  @Delete(':projectId')
  remove(@CurrentUserId() userId: string, @Param('projectId') projectId: string) {
    return this.projectsService.deleteProject(userId, projectId);
  }

  @Post(':projectId/rooms')
  @ApiOperation({ summary: 'Add a room to a project (E1)' })
  addRoom(
    @CurrentUserId() userId: string,
    @Param('projectId') projectId: string,
    @Body(new ZodValidationPipe(createRoomSchema)) input: CreateRoomInput,
  ) {
    return this.projectsService.addRoom(userId, projectId, input);
  }
}
