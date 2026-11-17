import { DurableObject } from 'cloudflare:workers';

export class Subscription extends DurableObject {
  async alarm() {
    await this.ctx.storage.deleteAll();
  }
}

export default {
  fetch() {
    return new Response(null, { status: 410 });
  },
};
