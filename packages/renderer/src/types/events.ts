export interface RoomStatusEventPayload {
  roomId?: string;
  room_id?: string;
  status?: string;
  liveId?: string | null;
  streamInfo?: any | null;
}
