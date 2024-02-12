import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { createClient } from 'redis';
import { PrismaClient } from '../node_modules/@prisma/client/property';

export { type Property } from '../node_modules/@prisma/client/property';

const server = (async () => {

  const prisma = new PrismaClient()

  const publisher = await createClient()
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

  const app = new Hono()


  const getProperties =
    app.get('/', async (c) => c.json(await prisma.property.findMany()))

  app.post('/', async (c) => {
    const body = await c.req.parseBody()
    const property = await prisma.property.create({
      data: {
        country: body['country'] as string,
        city: body['city'] as string,
        street: body['street'] as string,
        buildingNumber: body['buildingNumber'] as string,
        description: body['description'] as string,
        occupied: body['occupied'] === 'true'
      }
    })
    await publisher.publish('property', JSON.stringify(property));
    return c.json(property)
  })

  const port = 3001
  console.log(`Server is running on port ${port}`)

  serve({
    fetch: app.fetch,
    port
  })
  return { getProperties }
})()


export type GetProperties = Awaited<typeof server>['getProperties']