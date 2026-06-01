export interface RSVPData {
  name: string;
  attending: boolean;
  withPlusOne: boolean;
  plusOneName?: string;
  submittedAt?: string;
}

export interface GuestCheckResponse {
  found: boolean;
  guestName?: string;
  allowedPlusOne?: boolean;
  alreadySubmitted?: boolean;
  existingRSVP?: RSVPData | null;
  error?: string;
}

export interface EntourageMember {
  role: string;
  names: string[];
}
