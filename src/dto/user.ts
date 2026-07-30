import { User } from "@prisma/client";
export class UserDto {
  id: number;
  name: string;
  email: string;
  profile: string | null;
  type: string;
  phone: string | null;
  address: string | null;
  dob: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.profile = user.profile;
    this.type = user.type;
    this.phone = user.phone;
    this.address = user.address;
    this.dob = user.dob;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static plainToInstance(user: User) {
    return new UserDto(user);
  }
}
