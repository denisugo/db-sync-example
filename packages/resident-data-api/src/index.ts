import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createClient } from 'redis';
import { PrismaClient } from '../node_modules/@prisma/client/residents';

export { type Resident } from '../node_modules/@prisma/client/residents';
const server = (async () => {

  const prisma = new PrismaClient()

  const publisher = await createClient()
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

  const app = new Hono()

  const getResidents =
    app.get('/', async (c) => c.json(await prisma.resident.findMany()))

  app.post('/', async (c) => {
    const body = await c.req.parseBody()
    const resident = await prisma.resident.create({
      data: {
        firstName: body['firstName'] as string,
        lastName: body['lastName'] as string,
        phone: body['phone'] as string,
        single: body['single'] === 'true',
        propertyId: body['propertyId'] as string
      }
    })
    await publisher.publish('resident', JSON.stringify(resident));
    return c.json(resident)
  })

  const port = 3000
  console.log(`Server is running on port ${port}`)

  serve({
    fetch: app.fetch,
    port
  })
  return { getResidents }
})()
export type GetResidents = Awaited<typeof server>['getResidents']
