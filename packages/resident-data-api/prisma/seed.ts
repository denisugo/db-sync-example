import { faker } from '@faker-js/faker';
import { PrismaClient } from '../node_modules/@prisma/client/residents';

const prisma = new PrismaClient()
async function main() {
    for (let index = 1; index <= 20; index++) {
        const id = `123e4567-e89b-12d3-a456-4266141740${index}`
        await prisma.resident.upsert({
            where: { id },
            update: {},
            create: {
                id,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                phone: faker.phone.number(),
                single: faker.datatype.boolean(),
                createdAt: faker.date.past(),
                propertyId: `123e4567-e89b-12d3-a456-4266141740${index}`
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
