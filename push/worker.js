import { DurableObject } from 'cloudflare:workers';
import * as webPush from 'web-push';
import { catalogs, solarTimes, windowsFor } from '../dist/nadika.js';

const site = 'https://nakshatra-minastro.peppydell22.chatgpt.site';
const minute = 60000;
const day = 1440 * minute;

function reading(now, lat, lon, mode) {
  const local = now + 390 * minute;
  const midnight = Math.floor(local / day) * day;
  const dateAt = (t) => new Date(t).toISOString().slice(0, 10);
  const clock = (local - midnight) / minute;
  const { sunrise, sunset } = solarTimes(dateAt(midnight), lat, lon);
  const previous = clock < sunrise;
  const night = previous || clock >= sunset;
  const cycle = previous ? midnight - day : midnight;
  const start = previous ? solarTimes(dateAt(cycle), lat, lon).sunset - 1440 : night ? sunset : sunrise;
  const end = previous ? sunrise : night ? 1440 + solarTimes(dateAt(midnight + day), lat, lon).sunrise : sunset;
  const slot = windowsFor(start, end, mode).find(({ start, end }) => clock >= start && clock < end);
  return {
    entry: slot && catalogs[new Date(cycle).getUTCDay()][slot.number - 1],
    next: Math.ceil(midnight + (slot?.end ?? end) * minute - 390 * minute) + 250,
  };
}

export class Subscription extends DurableObject {
  async fetch(request) {
    if (request.method === 'DELETE') {
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
      return new Response(null, { status: 204 });
    }
    const config = await request.json();
    if (new URL(request.url).pathname === '/test') {
      const response = await this.send(config, 'စမ်းသပ် အသိပေးချက်', 'Nakshatra အသိပေးချက်ကို ဖုန်းတွင် လက်ခံရရှိပါပြီ။');
      return new Response(null, { status: response.ok ? 204 : response.status });
    }
    await this.ctx.storage.put('config', config);
    await this.ctx.storage.setAlarm(reading(Date.now(), config.lat, config.lon, config.mode).next);
    return new Response(null, { status: 204 });
  }

  async alarm() {
    const config = await this.ctx.storage.get('config');
    if (!config) return;
    const { entry, next } = reading(Date.now(), config.lat, config.lon, config.mode);
    await this.ctx.storage.setAlarm(next);
    if (!entry) return;
    const [name, effect] = entry;
    const response = await this.send(config, name, effect);
    if ([404, 410].includes(response.status)) {
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
    } else if (!response.ok) {
      console.error('Push provider returned', response.status);
    }
  }

  async send(config, name, effect) {
    const details = webPush.generateRequestDetails(config.subscription, JSON.stringify({ name, effect }), {
      TTL: 120,
      vapidDetails: {
        subject: site,
        publicKey: this.env.VAPID_PUBLIC,
        privateKey: this.env.VAPID_PRIVATE,
      },
    });
    return fetch(details.endpoint, {
      method: 'POST', headers: details.headers, body: details.body, redirect: 'error',
    });
  }
}

export default {
  async fetch(request, env) {
    const headers = {
      'Access-Control-Allow-Origin': site,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.headers.get('Origin') !== site) return new Response(null, { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method === 'GET') return Response.json({ key: env.VAPID_PUBLIC }, { headers });
    try {
      if (!['POST', 'DELETE'].includes(request.method)) return new Response(null, { status: 405, headers });
      const raw = await request.text();
      if (raw.length > 4096) return new Response(null, { status: 413, headers });
      const config = JSON.parse(raw);
      const endpoint = new URL(config.subscription.endpoint);
      if (endpoint.protocol !== 'https:' || endpoint.port || endpoint.username || endpoint.password ||
          !['web.push.apple.com', 'fcm.googleapis.com', 'updates.push.services.mozilla.com'].some(
            host => endpoint.hostname === host || endpoint.hostname.endsWith('.' + host)
          )) throw new Error('Invalid push endpoint');
      if (request.method === 'POST') {
        for (const key of ['p256dh', 'auth']) {
          if (typeof config.subscription.keys?.[key] === 'string') {
            config.subscription.keys[key] = config.subscription.keys[key].replace(/=+$/, '');
          }
        }
      }
      if (request.method === 'POST' && !(Number.isFinite(config.lat) && config.lat >= 9 && config.lat <= 29 &&
          Number.isFinite(config.lon) && config.lon >= 92 && config.lon <= 102 &&
          /^[\w-]{87}$/.test(config.subscription.keys?.p256dh) &&
          /^[\w-]{22}$/.test(config.subscription.keys?.auth))) throw new Error('Invalid subscription');
      const object = env.SUBSCRIPTIONS.getByName(endpoint.href);
      const response = await object.fetch('https://subscription.internal' + new URL(request.url).pathname, {
        method: request.method, body: JSON.stringify(config),
      });
      return new Response(null, { status: response.status, headers });
    } catch {
      return new Response(null, { status: 400, headers });
    }
  },
};
