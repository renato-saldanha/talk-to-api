import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post(':phoneNumber/messages')
  async createMessage(
    @Param('phoneNumber') phoneNumber: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    try {
      return await this.conversationsService.processMessage(
        phoneNumber,
        createMessageDto.content,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':phoneNumber/status')
  async getStatus(@Param('phoneNumber') phoneNumber: string) {
    try {
      const status = await this.conversationsService.getStatus(phoneNumber);
      if (!status) {
        throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
      }
      return status;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
