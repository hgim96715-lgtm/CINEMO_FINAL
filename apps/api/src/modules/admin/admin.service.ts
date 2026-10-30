import { Injectable } from "@nestjs/common";

import { AdminRepository } from "./admin.repository";

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  findUsers() {
    return this.adminRepository.findUsers();
  }

  findUserActivity(userId: string) {
    return this.adminRepository.findUserActivity(userId);
  }
}
