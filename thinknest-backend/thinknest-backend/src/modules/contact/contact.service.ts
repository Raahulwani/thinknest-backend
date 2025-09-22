import { AppDataSource } from '../../config/data-source';
import { ContactMessage } from './entities/contact-message.entity';

export class ContactService {
  private repo = AppDataSource.getRepository(ContactMessage);

  async create(payload: Partial<ContactMessage>) {
    const entity = this.repo.create(payload);
    return this.repo.save(entity);
  }
}
