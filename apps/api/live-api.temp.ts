import { createApp } from './src/app';
import { InProcessEventPublisher } from './src/shared/events/EventPublisher';
import { InMemoryProfileRepository } from './src/modules/profile/test-support/InMemoryProfileRepository';

createApp({
  profileRepository: new InMemoryProfileRepository(),
  eventPublisher: new InProcessEventPublisher(),
  corsOrigins: ['http://localhost:3000'],
}).listen(4000, () => console.log('API READY'));
