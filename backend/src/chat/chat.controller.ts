import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

class SendMessageDto {
  @IsString() @IsOptional() body?: string;
  @IsString() @IsOptional() imageUrl?: string;
  @IsString() @IsOptional() audioUrl?: string;
  @IsInt() @Min(1) @IsOptional() audioDuration?: number;
}

class StartConversationDto {
  @IsString() farmerId: string;
  @IsString() @IsOptional() orderId?: string;
}

class DeliveryConversationDto {
  @IsString() jobId: string;
}

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private service: ChatService) {}

  @Post('conversations')
  @Roles('buyer')
  @ApiOperation({ summary: 'Start or get a conversation with a farmer' })
  startConversation(@CurrentUser() user: any, @Body() dto: StartConversationDto) {
    return this.service.getOrCreateConversation(user.id, dto.farmerId, dto.orderId);
  }

  @Post('conversations/delivery')
  @Roles('transport')
  @ApiOperation({ summary: 'Open in-app chat for an assigned delivery job' })
  deliveryConversation(@CurrentUser() user: any, @Body() dto: DeliveryConversationDto) {
    return this.service.getOrCreateDeliveryConversation(user.id, dto.jobId);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations for current user' })
  getConversations(@CurrentUser() user: any) {
    return this.service.getUserConversations(user.id, user.role);
  }

  @Get('conversations/:id/contact')
  @ApiOperation({ summary: 'Get the other participant contact info for a conversation' })
  getContact(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getConversationContact(id, user.id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation (cursor-paginated)' })
  getMessages(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.service.getMessages(id, user.id, cursor);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message via REST (fallback when socket is unavailable)' })
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(
      user.id,
      id,
      dto.body ?? '',
      dto.imageUrl,
      dto.audioUrl,
      dto.audioDuration,
    );
  }
}
