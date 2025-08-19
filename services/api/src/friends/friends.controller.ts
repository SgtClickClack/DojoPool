import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { FriendsService } from './friends.service';

interface SendRequestDto {
  addresseeId: string;
}

interface RespondDto {
  action: 'accept' | 'decline';
}

function getCurrentUserId(headers: Record<string, string | string[] | undefined>): string {
  const fromHeader = (headers['x-user-id'] || headers['X-User-Id']) as string | undefined;
  // In a real setup, this comes from auth middleware/session/JWT
  if (!fromHeader || fromHeader.length === 0) {
    // For development/test we can default a static user id or throw
    // Throwing encourages clients/tests to pass the header explicitly
    throw new Error('Missing x-user-id header for identifying current user');
  }
  return fromHeader;
}

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('requests')
  async sendRequest(@Headers() headers: Record<string, any>, @Body() body: SendRequestDto) {
    const currentUserId = getCurrentUserId(headers);
    return this.friendsService.sendRequest(currentUserId, body.addresseeId);
  }

  @Get('requests')
  async listIncoming(@Headers() headers: Record<string, any>) {
    const currentUserId = getCurrentUserId(headers);
    return this.friendsService.listIncomingRequests(currentUserId);
  }

  @Patch('requests/:id')
  async respond(@Headers() headers: Record<string, any>, @Param('id') id: string, @Body() body: RespondDto) {
    const currentUserId = getCurrentUserId(headers);
    if (body.action !== 'accept' && body.action !== 'decline') {
      throw new Error('Invalid action, expected "accept" or "decline"');
    }
    return this.friendsService.respondToRequest(currentUserId, id, body.action);
  }

  @Get()
  async listFriends(@Headers() headers: Record<string, any>) {
    const currentUserId = getCurrentUserId(headers);
    return this.friendsService.listFriends(currentUserId);
  }
}
