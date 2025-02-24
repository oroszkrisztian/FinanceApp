import { FundRepository } from "../repositories/fundRepository";


export class FundService {
  private fundRepository: FundRepository;

  constructor() {
    this.fundRepository = new FundRepository();
  }

  async getUserFunds(userId: number) {
    const funds = await this.fundRepository.getFundsByUserId(userId);
    return funds;
  }
}