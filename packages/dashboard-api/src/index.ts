import { GetProperties, Property } from '@db-sync/property-data-api/src/index';
import { GetResidents, Resident } from '@db-sync/resident-data-api/src/index';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { ClientResponse, hc } from 'hono/client';
import { createClient } from 'redis';
import { PrismaClient } from '../node_modules/@prisma/client/dashboard';

async function fetchItems<T>(request: Promise<ClientResponse<T>>, errorMessage: string) {
  const response = await request
  if (!response.ok) {
    throw new Error(errorMessage)
  }
  return await response.json()
}

async function checkProperties(prisma: PrismaClient<any>) {
  const propertiesFromPropertyDb = await fetchItems(
    hc<GetProperties>('http://localhost:3001').index.$get(),
    'Unable to fetch properties'
  )
  // Assuming that sometimes the properties array MAY have values 
  // that are not yet stored in the dashboard database
  const properyIdsFromDasboardDb = (await prisma.property.findMany({ select: { id: true } }))
    .map(item => item.id)

  const differences = propertiesFromPropertyDb.filter(
    (element) => !properyIdsFromDasboardDb.includes(element.id)
  );

  console.log(differences); // TODO delete

  for (const d of differences) {
    await prisma.property.upsert({
      where: {
        id: d.id
      },
      update: {
        country: d.country,
        city: d.city,
        street: d.street,
        buildingNumber: d.buildingNumber,
        occupied: d.occupied,
      },
      create: {
        id: d.id,
        country: d.country,
        city: d.city,
        street: d.street,
        buildingNumber: d.buildingNumber,
        occupied: d.occupied,
      }
    })
  }
}

async function checkResidents(prisma: PrismaClient<any>) {
  const residentsFromResidentDb = await fetchItems(
    hc<GetResidents>('http://localhost:3000').index.$get(),
    'Unable to fetch residents'
  )
  // Assuming that sometimes the properties array MAY have values 
  // that are not yet stored in the dashboard database
  const residentIdsFromDasboardDb = (await prisma.resident.findMany({ select: { id: true } }))
    .map(item => item.id)

  const differences = residentsFromResidentDb.filter(
    (element) => !residentIdsFromDasboardDb.includes(element.id)
  );

  console.log(differences); // TODO delete

  for (const d of differences) {
    await prisma.resident.upsert({
      where: {
        id: d.id
      },
      update: {
        firstName: d.firstName,
        lastName: d.lastName,
        propertyId: d.propertyId
      },
      create: {
        id: d.id,
        firstName: d.firstName,
        lastName: d.lastName,
        propertyId: d.propertyId
      }
    })
  }
}

(async () => {

  const prisma = new PrismaClient()
  const subscriber = await createClient()
    .duplicate()
    .on('error', err => console.log('Redis Client Error', err))
    .connect();

  // Initial data fecthing
  await checkProperties(prisma)
  await checkResidents(prisma)

  await subscriber.subscribe('resident', async (message) => {
    const resident = JSON.parse(message) as Resident

    console.log(resident)

    await prisma.resident.upsert({
      where: {
        id: resident.id
      },
      update: {
        propertyId: resident.propertyId,
        lastName: resident.lastName,
        firstName: resident.firstName,
      },
      create: {
        id: resident.id,
        propertyId: resident.propertyId,
        lastName: resident.lastName,
        firstName: resident.firstName,
      }
    })
  })

  await subscriber.subscribe('property', async (message) => {
    const property = JSON.parse(message) as Property

    console.log(property)

    await prisma.property.upsert({
      where: {
        id: property.id
      },
      update: {
        country: property.country,
        city: property.city,
        street: property.street,
        buildingNumber: property.buildingNumber,
        occupied: property.occupied,
      },
      create: {
        id: property.id,
        country: property.country,
        city: property.city,
        street: property.street,
        buildingNumber: property.buildingNumber,
        occupied: property.occupied,
      }
    })
  })

  const app = new Hono()

  app.get('/', async (c) => {
    return c.json(await prisma.dashboard.findMany())
  })

  const port = 3002
  console.log(`Server is running on port ${port}`)

  serve({
    fetch: app.fetch,
    port
  })
})()
