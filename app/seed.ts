import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.verificationToken.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.calculation.deleteMany()
  await prisma.project.deleteMany()
  await prisma.group.deleteMany()
  await prisma.user.deleteMany()
  await prisma.climateRef.deleteMany()
  await prisma.materialConstant.deleteMany()

  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      emailVerified: true,
    },
  })

  const group = await prisma.group.create({
    data: {
      name: 'Demo Organization',
      userId: user.id,
    },
  })

  const project = await prisma.project.create({
    data: {
      name: 'Sample Residence',
      description: 'Example Manual J project seeded for development',
      groupId: group.id,
    },
  })

  const sampleInputs = {
    area: 1200,
    climateRefId: 'DEN-2025',
    envelope: {
      wallArea: 1200,
      wallR: 19,
      roofArea: 1000,
      roofR: 38,
      windowArea: 180,
      windowU: 0.3,
      windowSHGC: 0.3,
    },
    infiltration: {
      class: 'average',
      volume: 9000,
    },
    internal: {
      occupants: 3,
      lighting: 1200,
      appliances: 800,
    },
    ducts: {
      location: 'unconditioned',
      efficiency: 0.85,
    },
    climate: {
      summerDesignTemp: 92,
      winterDesignTemp: 5,
      indoorTemp: 75,
    },
  }

  const sampleResults = {
    sensible: 18500,
    latent: 4500,
    total: 24000,
    tonnage: 2.0,
    cfm: 800,
    breakdown: {
      conduction: { walls: 6000, roof: 3000, windows: 2500 },
      solar: 5000,
      infiltration: 2200,
      internal: 1800,
      ductLosses: 1000,
    },
  }

  await prisma.calculation.create({
    data: {
      projectId: project.id,
      version: 1,
      inputs: sampleInputs,
      results: sampleResults,
    },
  })

  await prisma.climateRef.createMany({
    data: [
      {
        zipCode: '80202',
        revision: 2025,
        variables: {
          summerDesignTemp: 92,
          winterDesignTemp: 5,
          latitude: 39.7525,
          longitude: -104.9995,
        },
      },
      {
        zipCode: '10001',
        revision: 2025,
        variables: {
          summerDesignTemp: 88,
          winterDesignTemp: 15,
          latitude: 40.7506,
          longitude: -73.9972,
        },
      },
      {
        zipCode: '30301',
        revision: 2025,
        variables: {
          summerDesignTemp: 95,
          winterDesignTemp: 20,
          latitude: 33.7488,
          longitude: -84.388,
        },
      },
      {
        zipCode: '90210',
        revision: 2025,
        variables: {
          summerDesignTemp: 85,
          winterDesignTemp: 42,
          latitude: 34.1016,
          longitude: -118.4143,
        },
      },
      {
        zipCode: '60601',
        revision: 2025,
        variables: {
          summerDesignTemp: 91,
          winterDesignTemp: -5,
          latitude: 41.8843,
          longitude: -87.6324,
        },
      },
    ],
  })

  await prisma.materialConstant.createMany({
    data: [
      { name: 'Air Density', value: 0.075, units: 'lb/ft3' },
      { name: 'Specific Heat of Air', value: 0.24, units: 'BTU/lb°F' },
      { name: 'Latent Heat of Vaporization', value: 1061, units: 'BTU/lb' },
    ],
  })

  console.log('✅ Seed complete')
  console.log(`   User: ${user.email}`)
  console.log(`   Group: ${group.name}`)
  console.log(`   Project: ${project.name}`)
  console.log(`   Climate zones: 5`)
  console.log(`   Material constants: 3`)
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
