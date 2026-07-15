import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsController, RoomsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController, RoomsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
