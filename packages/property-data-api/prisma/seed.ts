import { faker } from '@faker-js/faker';
import { PrismaClient } from '../node_modules/@prisma/client/property';

const prisma = new PrismaClient()
async function main() {
    for (let index = 1; index <= 20; index++) {
        const id = `123e4567-e89b-12d3-a456-4266141740${index}`
        await prisma.property.upsert({
            where: { id },
            update: {},
            create: {
                id,
                country: faker.location.country(),
                city: faker.location.city(),
                street: faker.location.street(),
                buildingNumber: faker.location.buildingNumber(),
                description: faker.commerce.productDescription(),
                occupied: faker.datatype.boolean(),
                createdAt: faker.date.past()
            },
        })
    }
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
